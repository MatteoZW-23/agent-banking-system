import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  index,
  serial,
} from "drizzle-orm/pg-core";

export const smsStatusEnum = pgEnum("sms_status", [
  "pending",
  "sent",
  "delivered",
  "failed",
]);

export const smsSeverityEnum = pgEnum("sms_severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

/**
 * SMS Notifications
 */
export const smsNotifications = pgTable(
  "sms_notifications",
  {
    id: serial("id").primaryKey(),
    alertId: integer("alert_id").notNull(),
    phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
    message: text("message").notNull(),
    status: smsStatusEnum("status").default("pending"),
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
 * SMS Configuration
 */
export const smsConfigurations = pgTable(
  "sms_configurations",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    phoneNumbers: text("phone_numbers").notNull(),
    alertTypes: text("alert_types").notNull(),
    minSeverity: smsSeverityEnum("min_severity").default("high"),
    isEnabled: integer("is_enabled").default(1),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  table => ({
    userIdIdx: index("idx_sms_config_user").on(table.userId),
  })
);

export type SMSConfiguration = typeof smsConfigurations.$inferSelect;
export type InsertSMSConfiguration = typeof smsConfigurations.$inferInsert;
