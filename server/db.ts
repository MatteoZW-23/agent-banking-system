import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
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
  workerBalanceSnapshots
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
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

// Provider queries
export async function getAllProviders() {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return [
        { id: 1, name: "EcoCash", category: "mobile_money", isActive: true, lastSyncAt: new Date() },
        { id: 2, name: "OneMoney", category: "mobile_money", isActive: true, lastSyncAt: new Date() },
        { id: 3, name: "InnBucks", category: "mobile_money", isActive: true, lastSyncAt: new Date() },
        { id: 4, name: "ZB Bank", category: "bank", isActive: true, lastSyncAt: new Date() },
        { id: 5, name: "CBZ Bank", category: "bank", isActive: true, lastSyncAt: new Date() },
        { id: 6, name: "NMB Bank", category: "bank", isActive: true, lastSyncAt: new Date() },
        { id: 7, name: "Steward Bank", category: "bank", isActive: true, lastSyncAt: new Date() },
        { id: 8, name: "Paynow", category: "fintech", isActive: true, lastSyncAt: new Date() },
        { id: 9, name: "PawaPay", category: "fintech", isActive: true, lastSyncAt: new Date() },
        { id: 10, name: "Tola Mobile", category: "fintech", isActive: true, lastSyncAt: new Date() },
      ];
    }
    return [];
  }
  return await db.select().from(providers).where(eq(providers.isActive, true));
}

export async function getProviderById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(providers).where(eq(providers.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getProviderByName(name: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(providers).where(eq(providers.name, name)).limit(1);
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

export async function getAllEmployees() {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return [
        { id: 1, uniqueCode: "EMP001", branchId: 1, name: "John Doe", email: "john@agent.co.zw", status: "active", role: "agent" },
        { id: 2, uniqueCode: "EMP002", branchId: 1, name: "Sarah Sibanda", email: "sarah@agent.co.zw", status: "active", role: "agent" },
        { id: 3, uniqueCode: "EMP003", branchId: 2, name: "Tinashe Moyo", email: "tinashe@agent.co.zw", status: "active", role: "supervisor" },
        { id: 4, uniqueCode: "EMP004", branchId: 3, name: "Blessing Phiri", email: "blessing@agent.co.zw", status: "active", role: "agent" },
        { id: 5, uniqueCode: "EMP005", branchId: 4, name: "Memory Mutasa", email: "memory@agent.co.zw", status: "active", role: "agent" },
      ];
    }
    return [];
  }
  return await db.select().from(employees).where(eq(employees.status, "active"));
}

export async function getEmployeeRegistrations(employeeId: number) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      // Mock registrations for John Doe (id: 1)
      if (employeeId === 1) {
        return [
          { id: 101, employeeId: 1, providerId: 1, agentCode: "EC-88220", merchantId: "EC-M-99", floatAccount: "ACC-001", commissionRate: "1.50" }, // EcoCash
          { id: 102, employeeId: 1, providerId: 2, agentCode: "OM-99211", merchantId: "OM-M-12", floatAccount: "ACC-001", commissionRate: "2.00" }, // OneMoney
          { id: 103, employeeId: 1, providerId: 6, agentCode: "IB-5521", merchantId: "IB-M-99", floatAccount: "ACC-099", commissionRate: "1.20" },  // InnBucks
        ];
      }
      return [
        { id: 201, employeeId: employeeId, providerId: 1, agentCode: `AG-${employeeId}-01`, merchantId: `M-${employeeId}`, floatAccount: "ACC-DEF", commissionRate: "1.50" },
      ];
    }
    return [];
  }
  return await db.select().from(agentRegistrations).where(eq(agentRegistrations.employeeId, employeeId));
}

export async function createCheckIn(data: any) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return { id: Math.floor(Math.random() * 1000), ...data, checkInTime: new Date() };
    }
    return null;
  }
  const [result] = await db.insert(checkIns).values(data);
  return { id: result.insertId, ...data };
}

export async function checkoutEmployee(checkInId: number, closingData: any) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return { id: checkInId, ...closingData, status: "verified" };
    }
    return null;
  }
  await db.update(checkIns).set({ ...closingData, checkOutTime: new Date() }).where(eq(checkIns.id, checkInId));
  return { id: checkInId, ...closingData };
}

export async function getLatestCheckIn(employeeId: number) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return null; // For dev, we'll start with fresh checkin
    }
    return null;
  }
  const result = await db.select().from(checkIns).where(eq(checkIns.employeeId, employeeId)).orderBy(desc(checkIns.checkInTime)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createFloatRequest(data: any) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return { id: Math.floor(Math.random() * 1000), ...data, status: "pending", requestTime: new Date() };
    }
    return null;
  }
  const [result] = await db.insert(floatRequests).values(data);
  return { id: result.insertId, ...data };
}

export async function getAllFloatRequests(status?: string) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return [
        { id: 1, employeeId: 1, providerId: 1, amount: "500.00", status: "pending", requestTime: new Date(), workerNotes: "High demand today" },
        { id: 2, employeeId: 2, providerId: 2, amount: "200.00", status: "pending", requestTime: new Date(), workerNotes: "Running low on OneMoney" },
      ];
    }
    return [];
  }
  if (status) {
    return await db.select().from(floatRequests).where(eq(floatRequests.status, status as any)).orderBy(desc(floatRequests.requestTime));
  }
  return await db.select().from(floatRequests).orderBy(desc(floatRequests.requestTime));
}

export async function getEmployeeFloatRequests(employeeId: number) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return [
        { id: 10, employeeId: employeeId, providerId: 6, amount: "150.00", status: "approved", requestTime: new Date() }
      ];
    }
    return [];
  }
  return await db.select().from(floatRequests).where(eq(floatRequests.employeeId, employeeId)).orderBy(desc(floatRequests.requestTime));
}

export async function processFloatRequest(id: number, data: any) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return { id, ...data, processedTime: new Date() };
    }
    return null;
  }
  await db.update(floatRequests).set({ ...data, processedTime: new Date() }).where(eq(floatRequests.id, id));
  return { id, ...data };
}

export async function createBalanceSnapshot(data: any) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return { id: Math.floor(Math.random() * 1000), ...data, timestamp: new Date() };
    }
    return null;
  }
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
  const result = await db.select().from(workerBalanceSnapshots).where(eq(workerBalanceSnapshots.employeeId, employeeId)).orderBy(desc(workerBalanceSnapshots.timestamp)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllBranches() {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return [
        { id: 1, name: "Harare CBD Hub", region: "Harare", managerName: "Tendai Zulu", status: "active" },
        { id: 2, name: "Bulawayo North", region: "Bulawayo", managerName: "Nqobizitha Dube", status: "active" },
        { id: 3, name: "Gweru Central", region: "Midlands", managerName: "Sihle Gumbo", status: "active" },
        { id: 4, name: "Mutare Border", region: "Manicaland", managerName: "Farai Chuma", status: "active" },
        { id: 5, name: "Masvingo South", region: "Masvingo", managerName: "Rumbidzai Zhou", status: "active" },
      ];
    }
    return [];
  }
  return await db.select().from(branches).where(eq(branches.status, "active"));
}

// Transaction queries
export async function getTransactionsByProvider(providerId: number, limit = 100, offset = 0) {
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

export async function getTransactionsByEmployee(employeeCode: string, limit = 100, offset = 0) {
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

export async function getTransactionsByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return [
        { id: 1, providerId: 1, type: "deposit", amount: "500.00", fee: "5.00", status: "completed", transactionTime: new Date(), providerReference: "ECO_882291", reconciliationStatus: "matched" },
        { id: 2, providerId: 4, type: "withdrawal", amount: "1200.00", fee: "12.00", status: "completed", transactionTime: new Date(), providerReference: "ZB_99211", reconciliationStatus: "mismatch" },
        { id: 3, providerId: 2, type: "bill_payment", amount: "45.00", fee: "1.50", status: "pending", transactionTime: new Date(Date.now() - 3600000), providerReference: "OM_7721", reconciliationStatus: "unreconciled" },
        { id: 4, providerId: 1, type: "airtime", amount: "10.00", fee: "0.20", status: "completed", transactionTime: new Date(Date.now() - 7200000), providerReference: "ECO_1122", reconciliationStatus: "matched" },
        { id: 5, providerId: 8, type: "deposit", amount: "2500.00", fee: "25.00", status: "failed", transactionTime: new Date(Date.now() - 86400000), providerReference: "PAY_4455", reconciliationStatus: "unreconciled" },
      ];
    }
    return [];
  }
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
  return await db.select().from(transactions).where(and(...conditions));
}

// Float queries
export async function getProviderFloats(providerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(providerFloats).where(eq(providerFloats.providerId, providerId));
}

export async function getTotalFloatBalance() {
  const db = await getDb();
  if (!db) {
    return process.env.NODE_ENV === "development" ? "12450.50" : "0";
  }
  const result = await db
    .select({ total: providerFloats.currentBalance })
    .from(providerFloats);
  const total = result.reduce((sum, row) => {
    const balance = typeof row.total === "string" ? parseFloat(row.total) : (row.total as number);
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
    .where(and(eq(commissionStructures.providerId, providerId), eq(commissionStructures.isActive, true)));
}

// Alert queries
export async function getAlertConfigurations(alertType?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(alertConfigurations.isActive, true)];
  if (alertType) {
    conditions.push(eq(alertConfigurations.alertType, alertType as any));
  }
  return await db.select().from(alertConfigurations).where(and(...conditions));
}

export async function getAlertHistory(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return [
        { id: 1, title: "Low Float Alert", message: "EcoCash float is below $500", severity: "critical", status: "triggered", triggeredAt: new Date() },
        { id: 2, title: "Reconciliation Discrepancy", message: "Mismatch in ZB Bank transaction #T8822", severity: "high", status: "triggered", triggeredAt: new Date() },
      ];
    }
    return [];
  }
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
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return [
        { id: 1, transactionId: 2, flagType: "velocity_threshold", reason: "3 withdrawals in < 1 min", riskScore: "0.85", status: "pending", createdAt: new Date() },
        { id: 2, transactionId: 5, flagType: "unusual_volume", reason: "Single amount > 3SD above avg", riskScore: "0.92", status: "pending", createdAt: new Date() },
        { id: 3, transactionId: 8, flagType: "pattern_match", reason: "Matched known fraud pattern #44", riskScore: "0.78", status: "resolved", createdAt: new Date(Date.now() - 86400000) },
      ];
    }
    return [];
  }
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
