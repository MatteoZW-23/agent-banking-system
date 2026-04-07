import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  index,
} from "drizzle-orm/mysql-core";

/**
 * SMS Notifications - logs all SMS messages sent for alerts
 */
export const smsNotifications = mysqlTable(
  "sms_notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    alertId: int("alert_id").notNull(),
    phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
    message: text("message").notNull(),
    status: mysqlEnum("status", [
      "pending",
      "sent",
      "delivered",
      "failed",
    ]).default("pending"),
    messageId: varchar("message_id", { length: 100 }),
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  table => ({
    alertIdIdx: index("idx_sms_alert").on(table.alertId),
    phoneNumberIdx: index("idx_sms_phone").on(table.phoneNumber),
    statusIdx: index("idx_sms_status").on(table.status),
    sentAtIdx: index("idx_sms_sent_at").on(table.sentAt),
  })
);

export type SMSNotification = typeof smsNotifications.$inferSelect;
export type InsertSMSNotification = typeof smsNotifications.$inferInsert;

/**
 * SMS Configuration - stores SMS alert settings per user/system
 */
export const smsConfigurations = mysqlTable(
  "sms_configurations",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id"),
    phoneNumbers: text("phone_numbers").notNull(), // JSON array of phone numbers
    alertTypes: text("alert_types").notNull(), // JSON array of alert types to notify
    minSeverity: mysqlEnum("min_severity", [
      "low",
      "medium",
      "high",
      "critical",
    ]).default("high"),
    isEnabled: int("is_enabled").default(1),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  table => ({
    userIdIdx: index("idx_sms_config_user").on(table.userId),
  })
);

export type SMSConfiguration = typeof smsConfigurations.$inferSelect;
export type InsertSMSConfiguration = typeof smsConfigurations.$inferInsert;
