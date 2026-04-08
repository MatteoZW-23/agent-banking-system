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
  workerBalanceSnapshots,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  const isPlaceholder = process.env.DATABASE_URL?.includes("user:password");

  if (!_db && process.env.DATABASE_URL && !isPlaceholder) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
      console.log("[Database] Initialized real database connection");
    } catch (error) {
      console.warn("[Database] Failed to initialize:", error);
      _db = null;
    }
  }

  if (!_db && process.env.NODE_ENV === "development") {
    // Return null to trigger mock responses
    return null;
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
        {
          id: 1,
          name: "EcoCash",
          category: "mobile_money",
          agentServiceName: "EcoCash Agent",
          apiEndpoint: "https://api.ecocash.co.zw/v1",
          authType: "oauth2",
          isActive: true,
          lastSyncAt: new Date(),
        },
        {
          id: 2,
          name: "OneMoney",
          category: "mobile_money",
          agentServiceName: "NetOne Agent",
          apiEndpoint: "https://api.netone.co.zw/onemoney",
          authType: "apikey",
          isActive: true,
          lastSyncAt: new Date(),
        },
        {
          id: 3,
          name: "InnBucks",
          category: "mobile_money",
          agentServiceName: "Simba Reward",
          apiEndpoint: "https://api.innbucks.co.zw",
          authType: "oauth2",
          isActive: true,
          lastSyncAt: new Date(),
        },
        {
          id: 4,
          name: "ZB Bank",
          category: "bank",
          agentServiceName: "Pauri",
          apiEndpoint: "https://api.zbbank.co.zw/agent",
          authType: "mtls",
          isActive: true,
          lastSyncAt: new Date(),
        },
        {
          id: 5,
          name: "CBZ Bank",
          category: "bank",
          agentServiceName: "CBZ Touch Agent",
          apiEndpoint: "https://api.cbz.co.zw",
          authType: "oauth2",
          isActive: true,
          lastSyncAt: new Date(),
        },
        {
          id: 6,
          name: "NMB Bank",
          category: "bank",
          agentServiceName: "NMBConnect",
          apiEndpoint: "https://api.nmb.co.zw",
          authType: "basic",
          isActive: true,
          lastSyncAt: new Date(),
        },
        {
          id: 7,
          name: "Steward Bank",
          category: "bank",
          agentServiceName: "Square Agent",
          apiEndpoint: "https://api.stewardbank.co.zw",
          authType: "oauth2",
          isActive: true,
          lastSyncAt: new Date(),
        },
        {
          id: 8,
          name: "Paynow",
          category: "aggregator",
          agentServiceName: "Paynow Zimbabwe",
          apiEndpoint: "https://www.paynow.co.zw/api",
          authType: "apikey",
          isActive: true,
          lastSyncAt: new Date(),
        },
        {
          id: 9,
          name: "PawaPay",
          category: "aggregator",
          agentServiceName: "PawaPay Global",
          apiEndpoint: "https://api.pawapay.io",
          authType: "apikey",
          isActive: true,
          lastSyncAt: new Date(),
        },
        {
          id: 10,
          name: "Tola Mobile",
          category: "aggregator",
          agentServiceName: "Tola Wallet",
          apiEndpoint: "https://api.tolamobile.com",
          authType: "oauth2",
          isActive: true,
          lastSyncAt: new Date(),
        },
      ];
    }
    return [];
  }
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

export async function getAllEmployees() {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return [
        {
          id: 0,
          uniqueCode: "AGT-001",
          branchId: 1,
          name: "Rufaro Murwira (Test Agent)",
          email: "agent@agent.co.zw",
          phone: "+263771112223",
          status: "active",
          role: "agent",
          preferredPayoutMethod: "EcoCash",
          payoutAccountNumber: "0771112223",
          salaryPercentage: "15.00"
        },
        {
          id: 1,
          uniqueCode: "EMP001",
          branchId: 1,
          name: "Takudzwa Machaya",
          email: "takudzwa@agent.co.zw",
          phone: "+263771234567",
          status: "active",
          role: "agent",
          preferredPayoutMethod: "InnBucks",
          payoutAccountNumber: "0771234567",
          salaryPercentage: "15.00"
        },
        {
          id: 2,
          uniqueCode: "EMP002",
          branchId: 1,
          name: "Sarah Sibanda",
          email: "sarah@agent.co.zw",
          phone: "+263772234567",
          status: "active",
          role: "agent",
        },
        {
          id: 3,
          uniqueCode: "EMP003",
          branchId: 2,
          name: "Tinashe Moyo",
          email: "tinashe@agent.co.zw",
          phone: "+263773234567",
          status: "active",
          role: "supervisor",
        },
        {
          id: 4,
          uniqueCode: "EMP004",
          branchId: 3,
          name: "Blessing Phiri",
          email: "blessing@agent.co.zw",
          phone: "+263774234567",
          status: "active",
          role: "agent",
        },
        {
          id: 5,
          uniqueCode: "EMP005",
          branchId: 4,
          name: "Memory Mutasa",
          email: "memory@agent.co.zw",
          phone: "+263775234567",
          status: "active",
          role: "agent",
        },
        {
          id: 6,
          uniqueCode: "EMP006",
          branchId: 1,
          name: "Tendai Zulu",
          email: "tendai@agent.co.zw",
          phone: "+263776234567",
          status: "active",
          role: "agent",
        },
        {
          id: 7,
          uniqueCode: "EMP007",
          branchId: 2,
          name: "Farai Chimo",
          email: "farai@agent.co.zw",
          phone: "+263777234567",
          status: "active",
          role: "agent",
        },
        {
          id: 8,
          uniqueCode: "EMP008",
          branchId: 3,
          name: "Vimbai Gomo",
          email: "vimbai@agent.co.zw",
          phone: "+263778234567",
          status: "active",
          role: "agent",
        },
        {
          id: 9,
          uniqueCode: "EMP009",
          branchId: 1,
          name: "Nyasha Hove",
          email: "nyasha@agent.co.zw",
          phone: "+263779234567",
          status: "active",
          role: "agent",
        },
        {
          id: 10,
          uniqueCode: "EMP010",
          branchId: 4,
          name: "Kudzai Dube",
          email: "kudzai@agent.co.zw",
          phone: "+263770234567",
          status: "active",
          role: "agent",
        },
      ];
    }
    return [];
  }
  return await db
    .select()
    .from(employees)
    .where(eq(employees.status, "active"));
}

export async function createEmployee(data: any) {
  // Auto-generate unique Staff ID if not provided (for security linking)
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const staffId = `AGT-${randomSuffix}`;
  
  const employeeData = {
    ...data,
    uniqueCode: staffId,
    status: "active",
  };

  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return {
        id: Math.floor(Math.random() * 1000),
        ...employeeData,
      };
    }
    return null;
  }
  const [result] = await db.insert(employees).values(employeeData);
  return { id: result.insertId, ...employeeData };
}

export async function updateEmployee(id: number, data: any) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return { id, ...data };
    }
    return null;
  }
  await db.update(employees).set(data).where(eq(employees.id, id));
  return { id, ...data };
}

export async function registerAgentLine(data: any) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return { id: Math.floor(Math.random() * 1000), ...data };
    }
    return null;
  }
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
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      // Mock registrations for John Doe (id: 1)
      if (employeeId === 1) {
        return [
          {
            id: 101,
            employeeId: 1,
            providerId: 1,
            agentCode: "EC-88220",
            merchantId: "EC-M-99",
            floatAccount: "ACC-001",
            commissionRate: "1.50",
          }, // EcoCash
          {
            id: 102,
            employeeId: 1,
            providerId: 2,
            agentCode: "OM-99211",
            merchantId: "OM-M-12",
            floatAccount: "ACC-001",
            commissionRate: "2.00",
          }, // OneMoney
          {
            id: 103,
            employeeId: 1,
            providerId: 3,
            agentCode: "IB-5521",
            merchantId: "IB-M-99",
            floatAccount: "ACC-099",
            commissionRate: "1.20",
          }, // InnBucks
        ];
      }
      return [
        {
          id: 201,
          employeeId: employeeId,
          providerId: 1,
          agentCode: `AG-${employeeId}-01`,
          merchantId: `M-${employeeId}`,
          floatAccount: "ACC-DEF",
          commissionRate: "1.50",
        },
      ];
    }
    return [];
  }
  return await db
    .select()
    .from(agentRegistrations)
    .where(eq(agentRegistrations.employeeId, employeeId));
}

export async function createCheckIn(data: any) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return {
        id: Math.floor(Math.random() * 1000),
        ...data,
        checkInTime: new Date(),
      };
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
  await db
    .update(checkIns)
    .set({ ...closingData, checkOutTime: new Date() })
    .where(eq(checkIns.id, checkInId));
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
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return {
        id: Math.floor(Math.random() * 1000),
        ...data,
        status: "pending",
        requestTime: new Date(),
      };
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
        {
          id: 1,
          employeeId: 1,
          providerId: 1,
          amount: "550.00",
          status: "pending",
          requestTime: new Date(Date.now() - 3600000),
          workerNotes: "High demand at CBD stall",
        },
        {
          id: 2,
          employeeId: 2,
          providerId: 2,
          amount: "200.00",
          status: "pending",
          requestTime: new Date(Date.now() - 4000000),
          workerNotes: "OneMoney running low",
        },
        {
          id: 3,
          employeeId: 6,
          providerId: 3,
          amount: "1200.00",
          status: "pending",
          requestTime: new Date(Date.now() - 2000000),
          workerNotes: "Bulk cashout needed",
        },
        {
          id: 4,
          employeeId: 4,
          providerId: 1,
          amount: "350.00",
          status: "transferred",
          requestTime: new Date(Date.now() - 8000000),
          workerNotes: "Morning topup",
          processedTime: new Date(),
          transactionReference: "TXN-882109",
        },
        {
          id: 5,
          employeeId: 5,
          providerId: 6,
          amount: "150.00",
          status: "declined",
          requestTime: new Date(Date.now() - 12000000),
          workerNotes: "End of day request",
          adminNotes: "Closed for the day",
        },
      ];
    }
    return [];
  }
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
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return [
        {
          id: 10,
          employeeId: employeeId,
          providerId: 6,
          amount: "150.00",
          status: "approved",
          requestTime: new Date(),
        },
      ];
    }
    return [];
  }
  return await db
    .select()
    .from(floatRequests)
    .where(eq(floatRequests.employeeId, employeeId))
    .orderBy(desc(floatRequests.requestTime));
}

export async function processFloatRequest(id: number, data: any) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return { id, ...data, processedTime: new Date() };
    }
    return null;
  }
  await db
    .update(floatRequests)
    .set({ ...data, processedTime: new Date() })
    .where(eq(floatRequests.id, id));
  return { id, ...data };
}

export async function createBalanceSnapshot(data: any) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return {
        id: Math.floor(Math.random() * 1000),
        ...data,
        timestamp: new Date(),
      };
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
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return [
        {
          id: 1,
          name: "Harare CBD Hub",
          region: "Harare",
          managerName: "Tendai Zulu",
          contactPhone: "+263771122334",
          status: "active",
        },
        {
          id: 2,
          name: "Bulawayo North",
          region: "Bulawayo",
          managerName: "Nqobizitha Dube",
          contactPhone: "+263772122334",
          status: "active",
        },
        {
          id: 3,
          name: "Gweru Central",
          region: "Midlands",
          managerName: "Sihle Gumbo",
          contactPhone: "+263773122334",
          status: "active",
        },
        {
          id: 4,
          name: "Mutare Border Node",
          region: "Manicaland",
          managerName: "Farai Chuma",
          contactPhone: "+263774122334",
          status: "active",
        },
        {
          id: 5,
          name: "Masvingo South",
          region: "Masvingo",
          managerName: "Rumbidzai Zhou",
          contactPhone: "+263775122334",
          status: "active",
        },
        {
          id: 6,
          name: "Chitungwiza Center",
          region: "Harare",
          managerName: "Mlandu N.",
          contactPhone: "+263776122334",
          status: "active",
        },
        {
          id: 7,
          name: "Kwekwe Hub",
          region: "Midlands",
          managerName: "Prosper M.",
          contactPhone: "+263777122334",
          status: "active",
        },
        {
          id: 8,
          name: "Beitbridge Logistics",
          region: "Mat South",
          managerName: "Tadiwa S.",
          contactPhone: "+263778122334",
          status: "active",
        },
        {
          id: 9,
          name: "Victoria Falls Node",
          region: "Mat North",
          managerName: "Kelvin K.",
          contactPhone: "+263779122334",
          status: "active",
        },
        {
          id: 10,
          name: "Marondera East",
          region: "Mash East",
          managerName: "Beauty T.",
          contactPhone: "+263770122334",
          status: "active",
        },
      ];
    }
    return [];
  }
  return await db.select().from(branches).where(eq(branches.status, "active"));
}

// Transaction queries
export async function getTransactionsByProvider(
  providerId: number,
  limit = 100,
  offset = 0
) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      const types = [
        "cash_in",
        "cash_out",
        "bill_payment",
        "airtime",
        "send_money",
        "data_bundle",
      ];
      const statuses = ["completed", "pending", "failed", "reversed"];
      const txs = [];
      const customers = [
        { name: "Takunda Moyo", phone: "263771***99" },
        { name: "Sibusiso Ndlovu", phone: "263772***12" },
        { name: "Ruva Chido", phone: "263773***88" },
        { name: "Tapiwa Muchira", phone: "263774***01" },
        { name: "Nyasha Sibanda", phone: "263712***55" },
      ];

      for (let i = 0; i < 40; i++) {
        const amount = (Math.random() * 800 + 10).toFixed(2);
        const fee = (parseFloat(amount) * 0.02).toFixed(2);
        const cust = customers[i % customers.length];

        txs.push({
          id: offset + i + 1,
          providerId,
          type: types[i % types.length],
          amount: amount,
          fee: fee,
          customerName: cust.name,
          customerPhone: cust.phone,
          status: i === 0 ? "pending" : statuses[i % statuses.length],
          transactionTime: new Date(Date.now() - i * 3600000),
          providerReference: `TX-${providerId}-${100000 + i}`,
          internalReference: `INT-${providerId}-${100000 + i}`,
          reconciliationStatus:
            i % 5 === 0 ? "matched" : i % 8 === 0 ? "mismatch" : "unreconciled",
        });
      }
      return txs;
    }
    return [];
  }
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
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      const allTxs = [];
      const types = [
        "cash_in",
        "cash_out",
        "bill_payment",
        "airtime",
        "send_money",
      ];

      for (let i = 1; i <= 60; i++) {
        const providerId = (i % 10) + 1;
        const amount = (Math.random() * 1200 + 5).toFixed(2);
        const fee = (parseFloat(amount) * 0.015).toFixed(2);

        allTxs.push({
          id: i,
          providerId,
          type: types[i % types.length],
          amount,
          fee,
          status:
            i % 12 === 0 ? "failed" : i % 20 === 0 ? "pending" : "completed",
          transactionTime: new Date(Date.now() - i * 900000),
          providerReference: `REF-${200000 + i}`,
          internalReference: `IREF-${200000 + i}`,
          reconciliationStatus:
            i % 4 === 0
              ? "matched"
              : i % 15 === 0
                ? "mismatch"
                : "unreconciled",
        });
      }
      return allTxs;
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
  return await db
    .select()
    .from(transactions)
    .where(and(...conditions));
}

// Float queries
export async function getProviderFloats(providerId: number) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      return [
        {
          id: providerId,
          providerId,
          openingBalance: "5000.00",
          currentBalance: (Math.random() * 2000 + 100).toFixed(2),
          minimumThreshold: "500.00",
          maximumThreshold: "10000.00",
          updatedAt: new Date(),
        },
      ];
    }
    return [];
  }
  return await db
    .select()
    .from(providerFloats)
    .where(eq(providerFloats.providerId, providerId));
}

export async function getTotalFloatBalance() {
  const db = await getDb();
  if (!db) {
    return process.env.NODE_ENV === "development" ? "18450.75" : "0";
  }
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
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      const common = { providerId, isActive: true, effectiveFrom: new Date() };
      if (providerId === 1) { // EcoCash: Tiered %
        return [
          { ...common, transactionType: "cash_out", commissionPercentage: "2.50", commissionFixed: "0.00", payoutFrequency: "weekly" },
          { ...common, transactionType: "cash_in", commissionPercentage: "0.20", commissionFixed: "0.05", payoutFrequency: "instant" },
          { ...common, transactionType: "bill_payment", commissionPercentage: "1.00", commissionFixed: "0.50", payoutFrequency: "monthly" },
        ];
      }
      if (providerId === 3) { // InnBucks: Instant Flat/Semi-flat
        return [
          { ...common, transactionType: "cash_out", commissionPercentage: "1.50", commissionFixed: "0.20", payoutFrequency: "instant" },
          { ...common, transactionType: "cash_in", commissionPercentage: "0.00", commissionFixed: "0.25", payoutFrequency: "instant" },
        ];
      }
      if (providerId === 2) { // Omari: High % + Bonuses
        return [
          { ...common, transactionType: "cash_out", commissionPercentage: "3.00", commissionFixed: "0.00", payoutFrequency: "instant" },
          { ...common, transactionType: "cash_in", commissionPercentage: "0.50", commissionFixed: "0.00", payoutFrequency: "instant" },
        ];
      }
      if (providerId === 4) { // ZB Bank: Fixed Fees
        return [
          { ...common, transactionType: "cash_out", commissionPercentage: "0.00", commissionFixed: "2.50", payoutFrequency: "weekly" },
          { ...common, transactionType: "cash_in", commissionPercentage: "0.00", commissionFixed: "1.00", payoutFrequency: "weekly" },
        ];
      }
    }
    return [];
  }
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
  if (!db) {
    if (process.env.NODE_ENV === "development") {
      const now = Date.now();
      return [
        {
          id: 201,
          title: "SECURITY: Suspicious Velocity",
          message:
            "Node EMP001 (John Doe) executed 5 cash-outs in 2 minutes. Pattern matches 'Rapid Drain' heuristic.",
          severity: "critical",
          status: "triggered",
          triggeredAt: new Date(now - 120000),
        },
        {
          id: 202,
          title: "CRITICAL: Float Depletion",
          message:
            "EcoCash Harare CBD Hub reached critical threshold ($42.50 remaining). Auto-topup failed.",
          severity: "critical",
          status: "triggered",
          triggeredAt: new Date(now - 450000),
        },
        {
          id: 203,
          title: "FRAUD: LLM Anomaly Detected",
          message:
            "Transaction TX-1-10022 flagged for review. Risk Score: 0.94. Unusual location/time pairing.",
          severity: "high",
          status: "triggered",
          triggeredAt: new Date(now - 1800000),
        },
        {
          id: 204,
          title: "RECON: Major Discrepancy",
          message:
            "OneMoney settlement for 2026-04-06 shows $1,400.00 mismatch between provider API and internal ledger.",
          severity: "high",
          status: "triggered",
          triggeredAt: new Date(now - 3600000),
        },
        {
          id: 205,
          title: "SYSTEM: Provider Gateway Slow",
          message:
            "InnBucks API experiencing high latency (avg 4.2s). Routing logic shifted to standby.",
          severity: "medium",
          status: "acknowledged",
          triggeredAt: new Date(now - 7200000),
        },
        {
          id: 206,
          title: "COMPLIANCE: KYC Missing",
          message:
            "Agent Sarah Sibanda processed 3 transactions over $500 without valid ID upload.",
          severity: "medium",
          status: "triggered",
          triggeredAt: new Date(now - 14400000),
        },
        {
          id: 207,
          title: "INFO: Daily Report Ready",
          message:
            "System-wide reconciliation for April 6, 2026 completed with 99.2% accuracy.",
          severity: "low",
          status: "acknowledged",
          triggeredAt: new Date(now - 86400000),
        },
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
        {
          id: 501,
          transactionId: 101,
          flagType: "suspicious_pattern",
          reason:
            "AI detected 'Smurfing' behavior: series of sub-$50 transactions to same recipient.",
          riskScore: "0.89",
          status: "flagged",
          createdAt: new Date(Date.now() - 3600000),
        },
        {
          id: 502,
          transactionId: 105,
          flagType: "unusual_amount",
          reason:
            "Outlier detection: Amount is 4.5 standard deviations above agent's daily average.",
          riskScore: "0.94",
          status: "flagged",
          createdAt: new Date(Date.now() - 7200000),
        },
        {
          id: 503,
          transactionId: 112,
          flagType: "timing_anomaly",
          reason:
            "Transaction occurred at 03:15 AM from a closed retail location node.",
          riskScore: "0.99",
          status: "flagged",
          createdAt: new Date(Date.now() - 14400000),
        },
        {
          id: 504,
          transactionId: 132,
          flagType: "unethical_behavior",
          reason:
            "Potential Internal Collusion: Transaction frequency between employee and fixed recipient exceeds velocity limits (12 TX/hr).",
          riskScore: "0.98",
          status: "flagged",
          createdAt: new Date(Date.now() - 43200000),
        },
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
