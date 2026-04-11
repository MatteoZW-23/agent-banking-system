import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  numeric,
  boolean,
  jsonb,
  date,
  index,
  unique,
  serial,
} from "drizzle-orm/pg-core";

/**
 * Enums
 */
export const roleEnum = pgEnum("role", ["admin", "supervisor", "manager", "agent"]);
export const branchStatusEnum = pgEnum("branch_status", ["active", "closed", "maintenance"]);
export const employeeStatusEnum = pgEnum("employee_status", ["active", "inactive", "suspended"]);
export const employeeRoleEnum = pgEnum("employee_role", ["agent", "supervisor", "manager"]);
export const payoutMethodEnum = pgEnum("payout_method", ["EcoCash", "InnBucks", "OneMoney", "Bank", "Cash"]);
export const providerCategoryEnum = pgEnum("provider_category", ["mobile_money", "bank", "fintech", "aggregator"]);
export const authTypeEnum = pgEnum("auth_type", ["oauth2", "apikey", "basic", "mtls", "none"]);
export const transactionTypeEnum = pgEnum("transaction_type", [
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
]);
export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "reversed",
  "disputed",
]);
export const reconciliationStatusEnum = pgEnum("reconciliation_status", [
  "unreconciled",
  "matched",
  "mismatch",
  "investigating",
]);
export const floatRequestStatusEnum = pgEnum("float_request_status", [
  "pending",
  "approved",
  "declined",
  "transferred",
  "completed",
]);
export const payoutFrequencyEnum = pgEnum("payout_frequency", [
  "instant",
  "weekly",
  "bi_weekly",
  "monthly",
]);
export const settlementStatusEnum = pgEnum("settlement_status", [
  "pending",
  "completed",
  "failed",
  "investigating",
]);
export const ledgerTypeEnum = pgEnum("ledger_type", ["earning", "disbursement", "shortage_penalty"]);
export const ledgerStatusEnum = pgEnum("ledger_status", ["pending", "cleared", "failed"]);
export const flagTypeEnum = pgEnum("flag_type", [
  "suspicious_pattern",
  "unusual_amount",
  "timing_anomaly",
  "duplicate_risk",
  "fraud_risk",
  "kyc_missing",
  "other",
]);
export const flagStatusEnum = pgEnum("flag_status", [
  "flagged",
  "reviewed",
  "resolved",
  "false_positive",
]);
export const alertTypeEnum = pgEnum("alert_type", [
  "discrepancy",
  "low_float",
  "failed_reconciliation",
  "suspicious_transaction",
  "high_commission",
  "other",
]);
export const thresholdUnitEnum = pgEnum("threshold_unit", ["amount", "percentage", "count"]);
export const alertStatusEnum = pgEnum("alert_status", [
  "triggered",
  "acknowledged",
  "resolved",
  "dismissed",
]);
export const severityEnum = pgEnum("severity", ["low", "medium", "high", "critical"]);
export const checkInStatusEnum = pgEnum("check_in_status", ["pending_adjustment", "verified", "discrepancy"]);
export const csvImportStatusEnum = pgEnum("csv_import_status", ["pending", "processing", "completed", "failed"]);
export const salaryStatusEnum = pgEnum("salary_status", ["pending", "processing", "disbursed", "failed"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  password: text("password"), // Added for password-based auth
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("agent").notNull(),
  mfaEnabled: boolean("mfaEnabled").default(false).notNull(),
  mfaSecret: text("mfaSecret"),
  mfaBackupCodes: jsonb("mfaBackupCodes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  agreedToTerms: boolean("agreedToTerms").default(false).notNull(),
  termsAgreedAt: timestamp("termsAgreedAt"),
  mustChangePassword: boolean("mustChangePassword").default(true).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Branches table
 */
export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  region: varchar("region", { length: 100 }),
  managerName: varchar("manager_name", { length: 100 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  status: branchStatusEnum("status").default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = typeof branches.$inferInsert;

/**
 * Employees table
 */
export const employees = pgTable(
  "employees",
  {
    id: serial("id").primaryKey(),
    uniqueCode: varchar("unique_code", { length: 50 }).notNull().unique(),
    branchId: integer("branch_id").references(() => branches.id),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    location: varchar("location", { length: 255 }),
    status: employeeStatusEnum("status").default("active"),
    role: employeeRoleEnum("role").default("agent"),
    preferredPayoutMethod: payoutMethodEnum("payout_method").default("EcoCash"),
    payoutAccountNumber: varchar("payout_account", { length: 100 }),
    salaryPercentage: numeric("salary_percentage", { precision: 5, scale: 2 }).default("15.00"),
    startingCapital: numeric("starting_capital", { precision: 15, scale: 2 }).default("0.00"),
    commissionBalance: numeric("commission_balance", { precision: 15, scale: 2 }).default("0.00"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  table => ({
    uniqueCodeIdx: index("idx_employees_unique_code").on(table.uniqueCode),
    branchIdIdx: index("idx_employees_branch").on(table.branchId),
  })
);

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

/**
 * Providers table
 */
export const providers = pgTable(
  "providers",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    category: providerCategoryEnum("category").notNull(),
    agentServiceName: varchar("agent_service_name", { length: 100 }),
    apiEndpoint: varchar("api_endpoint", { length: 255 }),
    authType: authTypeEnum("auth_type").notNull(),
    authConfig: jsonb("auth_config"),
    webhookUrl: varchar("webhook_url", { length: 255 }),
    settlementAccount: varchar("settlement_account", { length: 50 }),
    isActive: boolean("is_active").default(true),
    lastSyncAt: timestamp("last_sync_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  table => ({
    nameIdx: index("idx_providers_name").on(table.name),
    categoryIdx: index("idx_providers_category").on(table.category),
  })
);

export type Provider = typeof providers.$inferSelect;
export type InsertProvider = typeof providers.$inferInsert;

/**
 * Agent registrations
 */
export const agentRegistrations = pgTable(
  "agent_registrations",
  {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id").references(() => employees.id),
    providerId: integer("provider_id").notNull(),
    agentCode: varchar("agent_code", { length: 50 }).notNull(),
    merchantId: varchar("merchant_id", { length: 50 }),
    apiKeyEncrypted: text("api_key_encrypted"),
    apiSecretEncrypted: text("api_secret_encrypted"),
    floatAccount: varchar("float_account", { length: 50 }),
    commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }),
    isPrimary: boolean("is_primary").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  table => ({
    employeeIdIdx: index("idx_agent_reg_employee").on(table.employeeId),
    providerIdIdx: index("idx_agent_reg_provider").on(table.providerId),
    uniqueProviderAgent: unique("unique_provider_agent").on(
      table.providerId,
      table.agentCode
    ),
  })
);

export type AgentRegistration = typeof agentRegistrations.$inferSelect;
export type InsertAgentRegistration = typeof agentRegistrations.$inferInsert;

/**
 * Transactions table
 */
export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    providerId: integer("provider_id").notNull(),
    agentRegistrationId: integer("agent_registration_id"),
    employeeCode: varchar("employee_code", { length: 20 }),
    providerReference: varchar("provider_reference", { length: 200 }).notNull(),
    internalReference: varchar("internal_reference", { length: 100 }).notNull().unique(),
    type: transactionTypeEnum("type").notNull(),
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
    fee: numeric("fee", { precision: 15, scale: 2 }).default("0"),
    tax: numeric("tax", { precision: 15, scale: 2 }).default("0"),
    netAmount: numeric("net_amount", { precision: 15, scale: 2 }),
    customerPhone: varchar("customer_phone", { length: 15 }),
    customerNationalId: varchar("customer_national_id", { length: 20 }),
    customerName: varchar("customer_name", { length: 100 }),
    status: transactionStatusEnum("status").default("pending"),
    failureReason: text("failure_reason"),
    reconciliationStatus: reconciliationStatusEnum("reconciliation_status").default("unreconciled"),
    transactionTime: timestamp("transaction_time").notNull(),
    providerProcessedAt: timestamp("provider_processed_at"),
    syncedAt: timestamp("synced_at").defaultNow(),
    metadata: jsonb("metadata"),
  },
  table => ({
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
 * Provider floats
 */
export const providerFloats = pgTable(
  "provider_floats",
  {
    id: serial("id").primaryKey(),
    providerId: integer("provider_id").notNull(),
    agentRegistrationId: integer("agent_registration_id"),
    openingBalance: numeric("opening_balance", { precision: 15, scale: 2 }).notNull(),
    currentBalance: numeric("current_balance", { precision: 15, scale: 2 }).notNull(),
    minimumThreshold: numeric("minimum_threshold", { precision: 15, scale: 2 }).default("0"),
    maximumThreshold: numeric("maximum_threshold", { precision: 15, scale: 2 }),
    lastReconciledAt: timestamp("last_reconciled_at"),
    reconciledBy: integer("reconciled_by"),
    notes: text("notes"),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  table => ({
    providerIdIdx: index("idx_floats_provider").on(table.providerId),
    agentRegIdIdx: index("idx_floats_agent_reg").on(table.agentRegistrationId),
  })
);

export type ProviderFloat = typeof providerFloats.$inferSelect;
export type InsertProviderFloat = typeof providerFloats.$inferInsert;

/**
 * Float Requests
 */
export const floatRequests = pgTable(
  "float_requests",
  {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id").notNull(),
    providerId: integer("provider_id").notNull(),
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
    status: floatRequestStatusEnum("status").default("pending"),
    requestTime: timestamp("request_time").defaultNow(),
    processedTime: timestamp("processed_time"),
    processedBy: integer("processed_by"),
    workerNotes: text("worker_notes"),
    adminNotes: text("admin_notes"),
    transactionReference: varchar("transaction_reference", { length: 255 }),
  },
  table => ({
    employeeIdIdx: index("idx_float_req_employee").on(table.employeeId),
    providerIdIdx: index("idx_float_req_provider").on(table.providerId),
    statusIdx: index("idx_float_req_status").on(table.status),
  })
);

export type FloatRequest = typeof floatRequests.$inferSelect;
export type InsertFloatRequest = typeof floatRequests.$inferInsert;

/**
 * Commission structures
 */
export const commissionStructures = pgTable(
  "commission_structures",
  {
    id: serial("id").primaryKey(),
    providerId: integer("provider_id").notNull(),
    transactionType: varchar("transaction_type", { length: 30 }),
    minAmount: numeric("min_amount", { precision: 15, scale: 2 }).default("0"),
    maxAmount: numeric("max_amount", { precision: 15, scale: 2 }).default("999999999"),
    commissionPercentage: numeric("commission_percentage", { precision: 5, scale: 2 }),
    commissionFixed: numeric("commission_fixed", { precision: 15, scale: 2 }).default("0"),
    payoutFrequency: payoutFrequencyEnum("payout_frequency").default("instant"),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    isActive: boolean("is_active").default(true),
  },
  table => ({
    providerIdIdx: index("idx_commission_provider").on(table.providerId),
    effectiveFromIdx: index("idx_commission_effective_from").on(table.effectiveFrom),
  })
);

export type CommissionStructure = typeof commissionStructures.$inferSelect;
export type InsertCommissionStructure = typeof commissionStructures.$inferInsert;

/**
 * Daily settlements
 */
export const dailySettlements = pgTable(
  "daily_settlements",
  {
    id: serial("id").primaryKey(),
    providerId: integer("provider_id").notNull(),
    settlementDate: date("settlement_date").notNull(),
    expectedTotal: numeric("expected_total", { precision: 15, scale: 2 }).notNull(),
    actualTotal: numeric("actual_total", { precision: 15, scale: 2 }),
    discrepancy: numeric("discrepancy", { precision: 15, scale: 2 }),
    bankReference: varchar("bank_reference", { length: 100 }),
    settledAt: timestamp("settled_at"),
    status: settlementStatusEnum("status").default("pending"),
    notes: text("notes"),
  },
  table => ({
    providerDateIdx: unique("unique_provider_settlement_date").on(table.providerId, table.settlementDate),
    providerIdIdx: index("idx_settlement_provider").on(table.providerId),
    settlementDateIdx: index("idx_settlement_date").on(table.settlementDate),
  })
);

export type DailySettlement = typeof dailySettlements.$inferSelect;
export type InsertDailySettlement = typeof dailySettlements.$inferInsert;

/**
 * Commission ledger
 */
export const commissionLedger = pgTable(
  "commission_ledger",
  {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id").notNull(),
    providerId: integer("provider_id").notNull(),
    transactionId: integer("transaction_id"),
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
    type: ledgerTypeEnum("type").notNull(),
    status: ledgerStatusEnum("status").default("pending"),
    earnedAt: timestamp("earned_at").defaultNow(),
    payoutDate: date("payout_date"),
    payoutReference: varchar("payout_reference", { length: 255 }),
  },
  table => ({
    employeeIdIdx: index("idx_comm_ledger_employee").on(table.employeeId),
    providerIdIdx: index("idx_comm_ledger_provider").on(table.providerId),
    typeIdx: index("idx_comm_ledger_type").on(table.type),
  })
);

export type CommissionLedger = typeof commissionLedger.$inferSelect;
export type InsertCommissionLedger = typeof commissionLedger.$inferInsert;

/**
 * Transaction flags
 */
export const transactionFlags = pgTable(
  "transaction_flags",
  {
    id: serial("id").primaryKey(),
    transactionId: integer("transaction_id").notNull(),
    flagType: flagTypeEnum("flag_type").notNull(),
    riskScore: numeric("risk_score", { precision: 3, scale: 2 }),
    reason: text("reason").notNull(),
    llmAnalysis: jsonb("llm_analysis"),
    status: flagStatusEnum("status").default("flagged"),
    reviewedBy: integer("reviewed_by"),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  table => ({
    transactionIdIdx: index("idx_flags_transaction").on(table.transactionId),
    flagTypeIdx: index("idx_flags_type").on(table.flagType),
    statusIdx: index("idx_flags_status").on(table.status),
  })
);

export type TransactionFlag = typeof transactionFlags.$inferSelect;
export type InsertTransactionFlag = typeof transactionFlags.$inferInsert;

/**
 * Alert configurations
 */
export const alertConfigurations = pgTable(
  "alert_configurations",
  {
    id: serial("id").primaryKey(),
    alertType: alertTypeEnum("alert_type").notNull(),
    providerId: integer("provider_id"),
    threshold: numeric("threshold", { precision: 15, scale: 2 }),
    thresholdUnit: thresholdUnitEnum("threshold_unit"),
    isActive: boolean("is_active").default(true),
    notificationChannels: jsonb("notification_channels"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  table => ({
    alertTypeIdx: index("idx_alert_config_type").on(table.alertType),
    providerIdIdx: index("idx_alert_config_provider").on(table.providerId),
  })
);

export type AlertConfiguration = typeof alertConfigurations.$inferSelect;
export type InsertAlertConfiguration = typeof alertConfigurations.$inferInsert;

/**
 * Alert history
 */
export const alertHistory = pgTable(
  "alert_history",
  {
    id: serial("id").primaryKey(),
    alertConfigId: integer("alert_config_id").notNull(),
    providerId: integer("provider_id"),
    transactionId: integer("transaction_id"),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    severity: severityEnum("severity").default("medium"),
    status: alertStatusEnum("status").default("triggered"),
    acknowledgedBy: integer("acknowledged_by"),
    acknowledgedAt: timestamp("acknowledged_at"),
    triggeredAt: timestamp("triggered_at").defaultNow(),
    metadata: jsonb("metadata"),
  },
  table => ({
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
 * Workforce Check-ins
 */
export const checkIns = pgTable(
  "check_ins",
  {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id").notNull(),
    branchId: integer("branch_id"),
    openingCash: numeric("opening_cash", { precision: 15, scale: 2 }),
    closingCash: numeric("closing_cash", { precision: 15, scale: 2 }),
    openingLineBalances: jsonb("opening_line_balances"),
    closingLineBalances: jsonb("closing_line_balances"),
    expectedClosingCash: numeric("expected_closing_cash", { precision: 15, scale: 2 }),
    expectedClosingLineBalances: jsonb("expected_closing_line_balances"),
    discrepancyAmount: numeric("discrepancy_amount", { precision: 15, scale: 2 }).default("0"),
    checkInTime: timestamp("check_in_time").defaultNow(),
    checkOutTime: timestamp("check_out_time"),
    status: checkInStatusEnum("status").default("verified"),
    notes: text("notes"),
    metadata: jsonb("metadata"),
  },
  table => ({
    employeeDateIdx: index("idx_checkin_employee").on(table.employeeId),
    branchIdIdx: index("idx_checkin_branch").on(table.branchId),
    checkInTimeIdx: index("idx_checkin_time").on(table.checkInTime),
  })
);

export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = typeof checkIns.$inferInsert;

/**
 * Worker Balance Snapshots
 */
export const workerBalanceSnapshots = pgTable(
  "worker_balance_snapshots",
  {
    id: serial("id").primaryKey(),
    checkInId: integer("check_in_id").notNull(),
    employeeId: integer("employee_id").notNull(),
    cashAmount: numeric("cash_amount", { precision: 15, scale: 2 }),
    floatBalances: jsonb("float_balances"),
    updateReason: varchar("update_reason", { length: 255 }),
    timestamp: timestamp("timestamp").defaultNow(),
  },
  table => ({
    checkInIdIdx: index("idx_balance_snapshot_checkin").on(table.checkInId),
    employeeIdIdx: index("idx_balance_snapshot_employee").on(table.employeeId),
  })
);

export type WorkerBalanceSnapshot = typeof workerBalanceSnapshots.$inferSelect;
export type InsertWorkerBalanceSnapshot = typeof workerBalanceSnapshots.$inferInsert;

/**
 * CSV imports
 */
export const csvImports = pgTable(
  "csv_imports",
  {
    id: serial("id").primaryKey(),
    providerId: integer("provider_id").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    importDate: date("import_date").notNull(),
    totalRecords: integer("total_records"),
    successfulRecords: integer("successful_records"),
    failedRecords: integer("failed_records"),
    status: csvImportStatusEnum("status").default("pending"),
    errorLog: text("error_log"),
    importedBy: integer("imported_by"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  table => ({
    providerIdIdx: index("idx_csv_imports_provider").on(table.providerId),
    importDateIdx: index("idx_csv_imports_date").on(table.importDate),
  })
);

export type CsvImport = typeof csvImports.$inferSelect;
export type InsertCsvImport = typeof csvImports.$inferInsert;

/**
 * Salaries table
 */
export const salaries = pgTable(
  "salaries",
  {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id").references(() => employees.id),
    month: varchar("month", { length: 7 }).notNull(),
    totalCommissionProduced: numeric("total_commission_produced", { precision: 15, scale: 2 }).notNull(),
    salaryAmount: numeric("salary_amount", { precision: 15, scale: 2 }).notNull(),
    bonusAmount: numeric("bonus_amount", { precision: 15, scale: 2 }).default("0"),
    deductions: numeric("deductions", { precision: 15, scale: 2 }).default("0"),
    netPayout: numeric("net_payout", { precision: 15, scale: 2 }).notNull(),
    status: salaryStatusEnum("status").default("pending"),
    payoutReference: varchar("payout_reference", { length: 255 }),
    disbursedAt: timestamp("disbursed_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  table => ({
    employeeMonthIdx: unique("unique_employee_month").on(table.employeeId, table.month),
    employeeIdIdx: index("idx_salary_employee").on(table.employeeId),
    monthIdx: index("idx_salary_month").on(table.month),
  })
);

export type Salary = typeof salaries.$inferSelect;
export type InsertSalary = typeof salaries.$inferInsert;
