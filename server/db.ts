import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser,
  users,
  providers,
  agentRegistrations,
  transactions,
  providerFloats,
  commissionStructures,
  employees,
  alertConfigurations,
  alertHistory,
  transactionFlags,
  dailySettlements,
  csvImports,
  checkIns,
  floatRequests,
  branches,
  workerBalanceSnapshots,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

export async function getDb() {
  const isPlaceholder = process.env.DATABASE_URL?.includes("user:password");

  if (!_db && process.env.DATABASE_URL && !isPlaceholder) {
    try {
      _client = postgres(process.env.DATABASE_URL, { prepare: false, connect_timeout: 5000 });
      _db = drizzle(_client);
      console.log("[Database] Initialized Supabase/Postgres connection");
    } catch (error) {
      console.warn("[Database] Failed to initialize Supabase:", error);
      _db = null;
    }
  }

  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "password"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.mustChangePassword !== undefined) {
      values.mustChangePassword = user.mustChangePassword;
      updateSet.mustChangePassword = user.mustChangePassword;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: [users.openId],
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUser(openId: string, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(users).set(data).where(eq(users.openId, openId));
  return await getUserByOpenId(openId);
}

export async function setUserPassword(email: string, password: string) {
  const db = await getDb();
  if (!db) return null;
  await db
    .update(users)
    .set({ password, mustChangePassword: false })
    .where(eq(users.email, email));
}

// Provider queries
export async function getAllProviders() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(providers).where(eq(providers.isActive, true));
}

export async function getProviderById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(providers)
    .where(eq(providers.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getProviderByName(name: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(providers)
    .where(eq(providers.name, name))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

// Employee queries
export async function getEmployeeByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({
      id: employees.id,
      branchId: employees.branchId,
      uniqueCode: employees.uniqueCode,
      email: employees.email,
      location: employees.location,
      role: employees.role,
      status: employees.status,
      name: employees.name
    })
    .from(employees)
    .where(eq(employees.uniqueCode, code))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getEmployeeByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({
      id: employees.id,
      branchId: employees.branchId,
      uniqueCode: employees.uniqueCode,
      email: employees.email,
      location: employees.location,
      role: employees.role,
      status: employees.status,
      name: employees.name
    })
    .from(employees)
    .where(eq(employees.email, email))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllEmployees() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      id: employees.id,
      branchId: employees.branchId,
      uniqueCode: employees.uniqueCode,
      email: employees.email,
      location: employees.location,
      role: employees.role,
      status: employees.status,
      name: employees.name
    })
    .from(employees)
    .where(eq(employees.status, "active"));
}

export async function createEmployee(data: any) {
  // Auto-generate unique Staff ID based on role level for security
  const prefixes: Record<string, string> = {
    admin: "ADM",
    supervisor: "SUP",
    manager: "MGR",
    agent: "AGT",
  };
  
  const prefix = prefixes[data.role as string] || "EMP";
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const staffId = `${prefix}-${randomSuffix}`;
  
  // Generate a random 8-character password
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let tempPassword = "";
  for (let i = 0; i < 8; i++) {
    tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  const employeeData = {
    ...data,
    uniqueCode: staffId,
    status: "active",
    startingCapital: data.startingCapital ? data.startingCapital.toString() : "0.00",
    commissionBalance: "0.00",
  };

  const db = await getDb();
  if (!db) return null;
  
  // 1. Insert Employee
  const [result] = await db.insert(employees).values(employeeData).returning({ id: employees.id });
  
  // 2. Create User for Login
  const loginEmail = data.email?.trim() 
    ? data.email.toLowerCase() 
    : `${staffId.toLowerCase()}@agent.co.zw`;

  try {
    await upsertUser({
      openId: `usr-${data.role}-${staffId.toLowerCase()}`,
      name: data.name,
      email: loginEmail,
      role: data.role as any,
      password: tempPassword,
      mustChangePassword: true,
      lastSignedIn: new Date(),
    });
    console.log(`[Auth] User profile secured for ${data.name} (ID: ${staffId})`);
  } catch (err) {
    console.error("[Auth] Enrollment security failure:", err);
  }
  
  return { id: result.id, ...employeeData, tempPassword };
}

export async function updateEmployee(id: number, data: any) {
  const db = await getDb();
  if (!db) return null;
  await db.update(employees).set(data).where(eq(employees.id, id));
  return { id, ...data };
}

export async function registerAgentLine(data: any) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(agentRegistrations).values(data).returning({ id: agentRegistrations.id });
  return { id: result.id, ...data };
}

export async function deleteAgentLine(id: number) {
  const db = await getDb();
  if (!db) return null;
  await db.delete(agentRegistrations).where(eq(agentRegistrations.id, id));
  return { id };
}

export async function getEmployeeRegistrations(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(agentRegistrations)
    .where(eq(agentRegistrations.employeeId, employeeId));
}

/**
 * Shared logic to escalate balance anomalies to management
 */
async function triggerDiscrepancyAlert(employeeId: number, amount: number, expected: number, actual: number, context: 'Opening' | 'Closing') {
  if (Math.abs(amount) < 5) return;
  
  const db = await getDb();
  if (!db) return;

  const { alertService } = await import("./services/alertService");
  const emp = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
  const name = emp?.[0]?.name || `ID:${employeeId}`;
  
  let severity: "medium" | "high" | "critical" = "medium";
  if (amount < -10) severity = "critical";
  else if (Math.abs(amount) > 50) severity = "critical";
  else if (Math.abs(amount) > 10) severity = "high";

  await alertService.triggerAlert(
    "discrepancy",
    null,
    null,
    `Significant ${context} Variance`,
    `Agent ${name} reported a $${amount.toFixed(2)} variance at session ${context.toLowerCase()}. Expected: $${expected.toFixed(2)}, Reported: $${actual.toFixed(2)}.`,
    severity
  );
}

export async function createCheckIn(data: any) {
  const db = await getDb();
  if (!db) return null;

  // 1. Resolve Expected Balance (Last Checkout)
  const lastCheckIn = await getLatestCheckIn(data.employeeId);
  const expectedCash = lastCheckIn?.closingCash ? parseFloat(lastCheckIn.closingCash as any) : 0;
  
  // 2. Calculate Discrepancy
  const actualCash = data.openingCash || 0;
  const discrepancyAmount = actualCash - expectedCash;
  const status = Math.abs(discrepancyAmount) > 0.01 ? 'discrepancy' : 'verified';

  const checkInData = {
    ...data,
    discrepancyAmount: discrepancyAmount.toString(),
    status
  };

  const [result] = await db.insert(checkIns).values(checkInData).returning({ id: checkIns.id });

  // 3. Trigger Alert if significant
  await triggerDiscrepancyAlert(data.employeeId, discrepancyAmount, expectedCash, actualCash, 'Opening');

  return { id: result.id, ...checkInData };
}

export async function checkoutEmployee(checkInId: number, closingData: any) {
  const db = await getDb();
  if (!db) return null;

  // 1. Get CheckIn info
  const checkIn = await db.select().from(checkIns).where(eq(checkIns.id, checkInId)).limit(1);
  if (checkIn.length === 0) return null;

  // 2. Resolve Employee & Fiscal Context
  const emp = await db.select().from(employees).where(eq(employees.id, checkIn[0].employeeId)).limit(1);
  if (emp.length === 0) return null;

  const initialCapital = parseFloat(emp[0].startingCapital as any || "0");
  
  // 3. Dynamic Commission Integrity Check
  // We calculate commission for the duration of this shift
  const { commissionService } = await import("./services/commissionService");
  const shiftCommission = await commissionService.calculateEmployeeCommission(
    emp[0].uniqueCode,
    checkIn[0].checkInTime,
    new Date()
  );

  const earningsAccrued = shiftCommission.totalCommission || 0;
  const expectedTotalValue = initialCapital + earningsAccrued;
  
  // 4. Calculate Reporting Discrepancy
  // Reported Value = Reported Cash + Sum(Reported Line Balances)
  const actualCash = closingData.closingCash || 0;
  const actualLineTotal = Object.values(closingData.closingLineBalances || {}).reduce((s: number, v: any) => s + parseFloat(v || "0"), 0);
  const totalReportedValue = actualCash + actualLineTotal;
  
  const discrepancy = totalReportedValue - expectedTotalValue;
  const status = Math.abs(discrepancy) > 2 ? 'discrepancy' : 'verified';

  await db
    .update(checkIns)
    .set({ 
      ...closingData, 
      checkOutTime: new Date(),
      discrepancyAmount: discrepancy.toString(),
      status
    })
    .where(eq(checkIns.id, checkInId));

  // 5. Update Employee's Permanent Commission Balance
  const currentComm = parseFloat(emp[0].commissionBalance as any || "0");
  await db.update(employees)
    .set({ 
       commissionBalance: (currentComm + earningsAccrued).toString(),
       updatedAt: new Date()
    })
    .where(eq(employees.id, emp[0].id));

  // 6. Security Protocol: Centralized Escalation
  await triggerDiscrepancyAlert(emp[0].id, discrepancy, expectedTotalValue, totalReportedValue, 'Closing');

  return { 
    id: checkInId, 
    ...closingData, 
    status, 
    discrepancyAmount: discrepancy,
    earningsAccrued,
    expectedTotalValue
  };
}

export async function getLatestCheckIn(employeeId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(checkIns)
    .where(eq(checkIns.employeeId, employeeId))
    .orderBy(desc(checkIns.checkInTime))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createFloatRequest(data: any) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(floatRequests).values(data).returning({ id: floatRequests.id });
  return { id: result.id, ...data };
}

export async function getAllFloatRequests(status?: string) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return await db
      .select()
      .from(floatRequests)
      .where(eq(floatRequests.status, status as any))
      .orderBy(desc(floatRequests.requestTime));
  }
  return await db
    .select()
    .from(floatRequests)
    .orderBy(desc(floatRequests.requestTime));
}

export async function getEmployeeFloatRequests(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(floatRequests)
    .where(eq(floatRequests.employeeId, employeeId))
    .orderBy(desc(floatRequests.requestTime));
}

export async function processFloatRequest(id: number, data: any) {
  const db = await getDb();
  if (!db) return null;
  await db
    .update(floatRequests)
    .set({ ...data, processedTime: new Date() })
    .where(eq(floatRequests.id, id));
  return { id, ...data };
}

export async function createBalanceSnapshot(data: any) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(workerBalanceSnapshots).values(data).returning({ id: workerBalanceSnapshots.id });
  return { id: result.id, ...data };
}

export async function getLatestBalanceSnapshot(employeeId: number) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return null;
    }
    return null;
  }
  const result = await db
    .select()
    .from(workerBalanceSnapshots)
    .where(eq(workerBalanceSnapshots.employeeId, employeeId))
    .orderBy(desc(workerBalanceSnapshots.timestamp))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllBranches() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(branches).where(eq(branches.status, "active"));
}

// Transaction queries
export async function getTransactionsByProvider(
  providerId: number,
  limit = 100,
  offset = 0
) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.providerId, providerId))
    .orderBy(desc(transactions.transactionTime))
    .limit(limit)
    .offset(offset);
}

export async function getTransactionsByEmployee(
  employeeCode: string,
  limit = 100,
  offset = 0
) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.employeeCode, employeeCode))
    .orderBy(desc(transactions.transactionTime))
    .limit(limit)
    .offset(offset);
}

export async function getTransactionsByDateRange(
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(transactions)
    .where(
      and(
        gte(transactions.transactionTime, startDate),
        lte(transactions.transactionTime, endDate)
      )
    )
    .orderBy(desc(transactions.transactionTime));
}

export async function getUnreconciledTransactions(providerId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(transactions.reconciliationStatus, "unreconciled")];
  if (providerId) {
    conditions.push(eq(transactions.providerId, providerId));
  }
  return await db
    .select()
    .from(transactions)
    .where(and(...conditions));
}

// Float queries
export async function getProviderFloats(providerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(providerFloats)
    .where(eq(providerFloats.providerId, providerId));
}

export async function getTotalFloatBalance() {
  const db = await getDb();
  if (!db) return "0";
  const result = await db
    .select({ total: providerFloats.currentBalance })
    .from(providerFloats);
  const total = result.reduce((sum, row) => {
    const balance =
      typeof row.total === "string"
        ? parseFloat(row.total)
        : (row.total as number);
    return sum + balance;
  }, 0);
  return total.toString();
}

// Commission queries
export async function getCommissionStructures(providerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(commissionStructures)
    .where(
      and(
        eq(commissionStructures.providerId, providerId),
        eq(commissionStructures.isActive, true)
      )
    );
}

// Alert queries
export async function getAlertConfigurations(alertType?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(alertConfigurations.isActive, true)];
  if (alertType) {
    conditions.push(eq(alertConfigurations.alertType, alertType as any));
  }
  return await db
    .select()
    .from(alertConfigurations)
    .where(and(...conditions));
}

export async function getAlertHistory(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(alertHistory)
    .orderBy(desc(alertHistory.triggeredAt))
    .limit(limit)
    .offset(offset);
}

// Transaction flags queries
export async function getFlaggedTransactions(status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (status) {
    conditions.push(eq(transactionFlags.status, status as any));
  }
  return await db
    .select()
    .from(transactionFlags)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(transactionFlags.createdAt));
}
// Settlement queries
export async function getDailySettlement(providerId: number, date: Date) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(dailySettlements)
    .where(
      and(
        eq(dailySettlements.providerId, providerId),
        eq(dailySettlements.settlementDate, date.toISOString().split("T")[0])
      )
    )
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

// CSV Import queries
export async function getCsvImportHistory(providerId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(csvImports)
    .where(eq(csvImports.providerId, providerId))
    .orderBy(desc(csvImports.createdAt))
    .limit(limit);
}
