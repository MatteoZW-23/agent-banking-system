import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  date,
  index,
  unique,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Branches table - tracks physical locations/hubs of operations
 */
export const branches = mysqlTable(
  "branches",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    region: varchar("region", { length: 100 }),
    managerName: varchar("manager_name", { length: 100 }),
    contactPhone: varchar("contact_phone", { length: 20 }),
    status: mysqlEnum("status", ["active", "closed", "maintenance"]).default("active"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  }
);

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = typeof branches.$inferInsert;

/**
 * Employees table - tracks agents and their unique identifiers across platforms
 */
export const employees = mysqlTable(
  "employees",
  {
    id: int("id").autoincrement().primaryKey(),
    uniqueCode: varchar("unique_code", { length: 50 }).notNull().unique(),
    branchId: int("branch_id").references(() => branches.id),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    status: mysqlEnum("status", ["active", "inactive", "suspended"]).default("active"),
    role: mysqlEnum("role", ["agent", "supervisor", "manager"]).default("agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    uniqueCodeIdx: index("idx_employees_unique_code").on(table.uniqueCode),
    branchIdIdx: index("idx_employees_branch").on(table.branchId),
  })
);

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

/**
 * Providers table - registry of all payment providers (mobile money, banks, fintechs)
 */
export const providers = mysqlTable(
  "providers",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    category: mysqlEnum("category", ["mobile_money", "bank", "fintech", "aggregator"]).notNull(),
    agentServiceName: varchar("agent_service_name", { length: 100 }),
    apiEndpoint: varchar("api_endpoint", { length: 255 }),
    authType: mysqlEnum("auth_type", ["oauth2", "apikey", "basic", "mtls", "none"]).notNull(),
    authConfig: json("auth_config"),
    webhookUrl: varchar("webhook_url", { length: 255 }),
    settlementAccount: varchar("settlement_account", { length: 50 }),
    isActive: boolean("is_active").default(true),
    lastSyncAt: timestamp("last_sync_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index("idx_providers_name").on(table.name),
    categoryIdx: index("idx_providers_category").on(table.category),
  })
);

export type Provider = typeof providers.$inferSelect;
export type InsertProvider = typeof providers.$inferInsert;

/**
 * Agent registrations - credentials and configuration for each agent on each provider
 */
export const agentRegistrations = mysqlTable(
  "agent_registrations",
  {
    id: int("id").autoincrement().primaryKey(),
    employeeId: int("employee_id").references(() => employees.id),
    providerId: int("provider_id").notNull(),
    agentCode: varchar("agent_code", { length: 50 }).notNull(),
    merchantId: varchar("merchant_id", { length: 50 }),
    apiKeyEncrypted: text("api_key_encrypted"),
    apiSecretEncrypted: text("api_secret_encrypted"),
    floatAccount: varchar("float_account", { length: 50 }),
    commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
    isPrimary: boolean("is_primary").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    employeeIdIdx: index("idx_agent_reg_employee").on(table.employeeId),
    providerIdIdx: index("idx_agent_reg_provider").on(table.providerId),
    uniqueProviderAgent: unique("unique_provider_agent").on(table.providerId, table.agentCode),
  })
);

export type AgentRegistration = typeof agentRegistrations.$inferSelect;
export type InsertAgentRegistration = typeof agentRegistrations.$inferInsert;

/**
 * Transactions table - unified transaction model across all providers
 */
export const transactions = mysqlTable(
  "transactions",
  {
    id: int("id").autoincrement().primaryKey(),
    providerId: int("provider_id").notNull(),
    agentRegistrationId: int("agent_registration_id"),
    employeeCode: varchar("employee_code", { length: 20 }),
    
    // Transaction identifiers
    providerReference: varchar("provider_reference", { length: 200 }).notNull(),
    internalReference: varchar("internal_reference", { length: 100 }).notNull().unique(),
    
    // Transaction details
    type: mysqlEnum("type", [
      "cash_in",
      "cash_out",
      "send_money",
      "receive_money",
      "bill_payment",
      "airtime",
      "data_bundle",
      "ticket_purchase",
      "bank_transfer",
      "salary_disbursement",
      "float_purchase",
      "float_redemption",
    ]).notNull(),
    
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    fee: decimal("fee", { precision: 15, scale: 2 }).default("0"),
    tax: decimal("tax", { precision: 15, scale: 2 }).default("0"),
    netAmount: decimal("net_amount", { precision: 15, scale: 2 }),
    
    // Customer info (masked for privacy)
    customerPhone: varchar("customer_phone", { length: 15 }),
    customerNationalId: varchar("customer_national_id", { length: 20 }),
    customerName: varchar("customer_name", { length: 100 }),
    
    // Status tracking
    status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "reversed", "disputed"]).default("pending"),
    failureReason: text("failure_reason"),
    
    // Reconciliation flags
    reconciliationStatus: mysqlEnum("reconciliation_status", ["unreconciled", "matched", "mismatch", "investigating"]).default("unreconciled"),
    
    // Timestamps
    transactionTime: timestamp("transaction_time").notNull(),
    providerProcessedAt: timestamp("provider_processed_at"),
    syncedAt: timestamp("synced_at").defaultNow(),
    
    // Metadata
    metadata: json("metadata"),
  },
  (table) => ({
    providerIdIdx: index("idx_transactions_provider").on(table.providerId),
    employeeCodeIdx: index("idx_transactions_employee").on(table.employeeCode),
    transactionTimeIdx: index("idx_transactions_time").on(table.transactionTime),
    reconStatusIdx: index("idx_transactions_recon_status").on(table.reconciliationStatus),
    uniqueProviderRef: unique("unique_provider_ref").on(table.providerId, table.providerReference),
  })
);

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Provider floats - tracks float balances per provider per agent
 */
export const providerFloats = mysqlTable(
  "provider_floats",
  {
    id: int("id").autoincrement().primaryKey(),
    providerId: int("provider_id").notNull(),
    agentRegistrationId: int("agent_registration_id"),
    openingBalance: decimal("opening_balance", { precision: 15, scale: 2 }).notNull(),
    currentBalance: decimal("current_balance", { precision: 15, scale: 2 }).notNull(),
    minimumThreshold: decimal("minimum_threshold", { precision: 15, scale: 2 }).default("0"),
    maximumThreshold: decimal("maximum_threshold", { precision: 15, scale: 2 }),
    lastReconciledAt: timestamp("last_reconciled_at"),
    reconciledBy: int("reconciled_by"),
    notes: text("notes"),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    providerIdIdx: index("idx_floats_provider").on(table.providerId),
    agentRegIdIdx: index("idx_floats_agent_reg").on(table.agentRegistrationId),
  })
);

export type ProviderFloat = typeof providerFloats.$inferSelect;
export type InsertProviderFloat = typeof providerFloats.$inferInsert;

/**
 * Float Requests - tracks worker requests for more floating capital
 */
export const floatRequests = mysqlTable(
  "float_requests",
  {
    id: int("id").autoincrement().primaryKey(),
    employeeId: int("employee_id").notNull(),
    providerId: int("provider_id").notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    status: mysqlEnum("status", ["pending", "approved", "declined", "transferred"]).default("pending"),
    requestTime: timestamp("request_time").defaultNow(),
    processedTime: timestamp("processed_time"),
    processedBy: int("processed_by"),
    workerNotes: text("worker_notes"),
    adminNotes: text("admin_notes"),
    transactionReference: varchar("transaction_reference", { length: 255 }), // Bank/Momo transfer Ref
  },
  (table) => ({
    employeeIdIdx: index("idx_float_req_employee").on(table.employeeId),
    providerIdIdx: index("idx_float_req_provider").on(table.providerId),
    statusIdx: index("idx_float_req_status").on(table.status),
  })
);

export type FloatRequest = typeof floatRequests.$inferSelect;
export type InsertFloatRequest = typeof floatRequests.$inferInsert;

/**
 * Commission structures - flexible commission rules per provider and transaction type
 */
export const commissionStructures = mysqlTable(
  "commission_structures",
  {
    id: int("id").autoincrement().primaryKey(),
    providerId: int("provider_id").notNull(),
    transactionType: varchar("transaction_type", { length: 30 }),
    minAmount: decimal("min_amount", { precision: 15, scale: 2 }).default("0"),
    maxAmount: decimal("max_amount", { precision: 15, scale: 2 }).default("999999999"),
    commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }),
    commissionFixed: decimal("commission_fixed", { precision: 15, scale: 2 }).default("0"),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    isActive: boolean("is_active").default(true),
  },
  (table) => ({
    providerIdIdx: index("idx_commission_provider").on(table.providerId),
    effectiveFromIdx: index("idx_commission_effective_from").on(table.effectiveFrom),
  })
);

export type CommissionStructure = typeof commissionStructures.$inferSelect;
export type InsertCommissionStructure = typeof commissionStructures.$inferInsert;

/**
 * Daily settlements - tracks daily reconciliation per provider
 */
export const dailySettlements = mysqlTable(
  "daily_settlements",
  {
    id: int("id").autoincrement().primaryKey(),
    providerId: int("provider_id").notNull(),
    settlementDate: date("settlement_date").notNull(),
    expectedTotal: decimal("expected_total", { precision: 15, scale: 2 }).notNull(),
    actualTotal: decimal("actual_total", { precision: 15, scale: 2 }),
    discrepancy: decimal("discrepancy", { precision: 15, scale: 2 }),
    bankReference: varchar("bank_reference", { length: 100 }),
    settledAt: timestamp("settled_at"),
    status: mysqlEnum("status", ["pending", "completed", "failed", "investigating"]).default("pending"),
    notes: text("notes"),
  },
  (table) => ({
    providerDateIdx: unique("unique_provider_settlement_date").on(table.providerId, table.settlementDate),
    providerIdIdx: index("idx_settlement_provider").on(table.providerId),
    settlementDateIdx: index("idx_settlement_date").on(table.settlementDate),
  })
);

export type DailySettlement = typeof dailySettlements.$inferSelect;
export type InsertDailySettlement = typeof dailySettlements.$inferInsert;

/**
 * Transaction flags - LLM-flagged suspicious transactions
 */
export const transactionFlags = mysqlTable(
  "transaction_flags",
  {
    id: int("id").autoincrement().primaryKey(),
    transactionId: int("transaction_id").notNull(),
    flagType: mysqlEnum("flag_type", ["suspicious_pattern", "unusual_amount", "timing_anomaly", "duplicate_risk", "fraud_risk", "other"]).notNull(),
    riskScore: decimal("risk_score", { precision: 3, scale: 2 }),
    reason: text("reason").notNull(),
    llmAnalysis: json("llm_analysis"),
    status: mysqlEnum("status", ["flagged", "reviewed", "resolved", "false_positive"]).default("flagged"),
    reviewedBy: int("reviewed_by"),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    transactionIdIdx: index("idx_flags_transaction").on(table.transactionId),
    flagTypeIdx: index("idx_flags_type").on(table.flagType),
    statusIdx: index("idx_flags_status").on(table.status),
  })
);

export type TransactionFlag = typeof transactionFlags.$inferSelect;
export type InsertTransactionFlag = typeof transactionFlags.$inferInsert;

/**
 * Alert configurations - threshold settings for alerts
 */
export const alertConfigurations = mysqlTable(
  "alert_configurations",
  {
    id: int("id").autoincrement().primaryKey(),
    alertType: mysqlEnum("alert_type", ["discrepancy", "low_float", "failed_reconciliation", "suspicious_transaction", "high_commission", "other"]).notNull(),
    providerId: int("provider_id"),
    threshold: decimal("threshold", { precision: 15, scale: 2 }),
    thresholdUnit: mysqlEnum("threshold_unit", ["amount", "percentage", "count"]),
    isActive: boolean("is_active").default(true),
    notificationChannels: json("notification_channels"), // SMS, email, webhook
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    alertTypeIdx: index("idx_alert_config_type").on(table.alertType),
    providerIdIdx: index("idx_alert_config_provider").on(table.providerId),
  })
);

export type AlertConfiguration = typeof alertConfigurations.$inferSelect;
export type InsertAlertConfiguration = typeof alertConfigurations.$inferInsert;

/**
 * Alert history - audit trail of all alerts triggered
 */
export const alertHistory = mysqlTable(
  "alert_history",
  {
    id: int("id").autoincrement().primaryKey(),
    alertConfigId: int("alert_config_id").notNull(),
    providerId: int("provider_id"),
    transactionId: int("transaction_id"),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium"),
    status: mysqlEnum("status", ["triggered", "acknowledged", "resolved", "dismissed"]).default("triggered"),
    acknowledgedBy: int("acknowledged_by"),
    acknowledgedAt: timestamp("acknowledged_at"),
    triggeredAt: timestamp("triggered_at").defaultNow(),
    metadata: json("metadata"),
  },
  (table) => ({
    alertConfigIdIdx: index("idx_alert_history_config").on(table.alertConfigId),
    providerIdIdx: index("idx_alert_history_provider").on(table.providerId),
    transactionIdIdx: index("idx_alert_history_transaction").on(table.transactionId),
    statusIdx: index("idx_alert_history_status").on(table.status),
    triggeredAtIdx: index("idx_alert_history_triggered_at").on(table.triggeredAt),
  })
);

export type AlertHistory = typeof alertHistory.$inferSelect;
export type InsertAlertHistory = typeof alertHistory.$inferInsert;

/**
 * Workforce Check-ins - tracks daily opening/closing cash positions for agents
 */
export const checkIns = mysqlTable(
  "check_ins",
  {
    id: int("id").autoincrement().primaryKey(),
    employeeId: int("employee_id").notNull(),
    branchId: int("branch_id"),
    
    // Financial Snapshots
    openingCash: decimal("opening_cash", { precision: 15, scale: 2 }),
    closingCash: decimal("closing_cash", { precision: 15, scale: 2 }),
    openingLineBalances: json("opening_line_balances"), // JSON map of providerId -> amount
    closingLineBalances: json("closing_line_balances"), // JSON map of providerId -> amount
    
    // Temporal data
    checkInTime: timestamp("check_in_time").defaultNow(),
    checkOutTime: timestamp("check_out_time"),
    
    // Status & Validation
    status: mysqlEnum("status", ["pending_adjustment", "verified", "discrepancy"]).default("verified"),
    notes: text("notes"),
    metadata: json("metadata"), // Can include GPS coordinates, device ID
  },
  (table) => ({
    employeeDateIdx: index("idx_checkin_employee").on(table.employeeId),
    branchIdIdx: index("idx_checkin_branch").on(table.branchId),
    checkInTimeIdx: index("idx_checkin_time").on(table.checkInTime),
  })
);

export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = typeof checkIns.$inferInsert;

/**
 * Worker Balance Snapshots - tracks mid-shift updates of cash and floats
 */
export const workerBalanceSnapshots = mysqlTable(
  "worker_balance_snapshots",
  {
    id: int("id").autoincrement().primaryKey(),
    checkInId: int("check_in_id").notNull(),
    employeeId: int("employee_id").notNull(),
    
    // Updates
    cashAmount: decimal("cash_amount", { precision: 15, scale: 2 }),
    floatBalances: json("float_balances"), // JSON map of providerId -> amount
    updateReason: varchar("update_reason", { length: 255 }), // e.g. "After big cash-out"
    
    timestamp: timestamp("timestamp").defaultNow(),
  },
  (table) => ({
    checkInIdIdx: index("idx_balance_snapshot_checkin").on(table.checkInId),
    employeeIdIdx: index("idx_balance_snapshot_employee").on(table.employeeId),
  })
);

export type WorkerBalanceSnapshot = typeof workerBalanceSnapshots.$inferSelect;
export type InsertWorkerBalanceSnapshot = typeof workerBalanceSnapshots.$inferInsert;

/**
 * CSV imports - tracks bulk imports from offline providers
 */
export const csvImports = mysqlTable(
  "csv_imports",
  {
    id: int("id").autoincrement().primaryKey(),
    providerId: int("provider_id").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    importDate: date("import_date").notNull(),
    totalRecords: int("total_records"),
    successfulRecords: int("successful_records"),
    failedRecords: int("failed_records"),
    status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending"),
    errorLog: text("error_log"),
    importedBy: int("imported_by"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    providerIdIdx: index("idx_csv_imports_provider").on(table.providerId),
    importDateIdx: index("idx_csv_imports_date").on(table.importDate),
  })
);

export type CsvImport = typeof csvImports.$inferSelect;
export type InsertCsvImport = typeof csvImports.$inferInsert;
