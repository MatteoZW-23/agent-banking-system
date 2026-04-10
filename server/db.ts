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
      _client = postgres(process.env.DATABASE_URL, { prepare: false });
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

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

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
  await db.update(users).set({ password }).where(eq(users.email, email));
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
    .select()
    .from(employees)
    .where(eq(employees.uniqueCode, code))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getEmployeeByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(employees)
    .where(eq(employees.email, email))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllEmployees() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
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
  
  const employeeData = {
    ...data,
    uniqueCode: staffId,
    status: "active",
  };

  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(employees).values(employeeData);
  return { id: result.insertId, ...employeeData };
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
  const [result] = await db.insert(agentRegistrations).values(data);
  return { id: result.insertId, ...data };
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

export async function createCheckIn(data: any) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(checkIns).values(data);
  return { id: result.insertId, ...data };
}

export async function checkoutEmployee(checkInId: number, closingData: any) {
  const db = await getDb();
  if (!db) return null;
  await db
    .update(checkIns)
    .set({ ...closingData, checkOutTime: new Date() })
    .where(eq(checkIns.id, checkInId));
  return { id: checkInId, ...closingData };
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
  const [result] = await db.insert(floatRequests).values(data);
  return { id: result.insertId, ...data };
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
  const [result] = await db.insert(workerBalanceSnapshots).values(data);
  return { id: result.insertId, ...data };
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
        eq(dailySettlements.settlementDate, date)
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
