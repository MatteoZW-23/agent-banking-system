import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { AfricasTalkingSMSService } from "./smsService";

export interface SMSAlertConfig {
  enabled: boolean;
  phoneNumbers: string[];
  alertTypes: string[];
  minSeverity: "low" | "medium" | "high" | "critical";
}

/**
 * SMS Alert Service
 * Manages SMS notifications for critical system alerts
 */
export class SMSAlertService {
  private smsService: AfricasTalkingSMSService | null = null;
  private config: SMSAlertConfig = {
    enabled: false,
    phoneNumbers: [],
    alertTypes: [],
    minSeverity: "high",
  };

  constructor(smsService?: AfricasTalkingSMSService) {
    this.smsService = smsService || null;
    this.loadConfiguration();
  }

  /**
   * Load SMS configuration from environment
   */
  private loadConfiguration(): void {
    this.config = {
      enabled: process.env.SMS_ALERTS_ENABLED === "true",
      phoneNumbers: (process.env.SMS_ALERT_RECIPIENTS || "")
        .split(",")
        .filter(p => p.trim()),
      alertTypes: (
        process.env.SMS_ALERT_TYPES ||
        "discrepancy,low_float,failed_reconciliation"
      ).split(","),
      minSeverity: (process.env.SMS_MIN_SEVERITY || "high") as any,
    };
  }

  /**
   * Send SMS for an alert
   */
  async sendAlertSMS(
    alertId: number,
    alertType: string,
    message: string,
    severity: string
  ): Promise<boolean> {
    if (!this.config.enabled || !this.smsService) {
      console.log("[SMS Alert] SMS alerts disabled or service not configured");
      return false;
    }

    // Check if alert type should trigger SMS
    if (!this.shouldSendSMS(alertType, severity)) {
      return false;
    }

    try {
      const recipients = this.config.phoneNumbers;
      if (recipients.length === 0) {
        console.warn("[SMS Alert] No recipients configured");
        return false;
      }

      // Send SMS
      const responses = await this.smsService.sendAlertSMS(
        recipients,
        alertType,
        message,
        severity as any
      );

      console.log(
        `[SMS Alert] Sent SMS for alert ${alertId} to ${recipients.length} recipients`
      );
      return responses.some(r => r.success);
    } catch (error) {
      console.error("[SMS Alert] Failed to send alert SMS:", error);
      return false;
    }
  }

  /**
   * Check if SMS should be sent for this alert
   */
  private shouldSendSMS(alertType: string, severity: string): boolean {
    const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    const minSeverityLevel =
      severityOrder[this.config.minSeverity as keyof typeof severityOrder] || 2;
    const currentSeverityLevel =
      severityOrder[severity as keyof typeof severityOrder] || 0;

    return (
      this.config.alertTypes.includes(alertType) &&
      currentSeverityLevel >= minSeverityLevel
    );
  }

  /**
   * Update SMS configuration
   */
  updateConfiguration(config: Partial<SMSAlertConfig>): void {
    this.config = { ...this.config, ...config };
    console.log("[SMS Alert] Configuration updated:", this.config);
  }

  /**
   * Get current configuration
   */
  getConfiguration(): SMSAlertConfig {
    return { ...this.config };
  }

  /**
   * Test SMS service
   */
  async testService(testPhone: string): Promise<boolean> {
    if (!this.smsService) {
      console.warn("[SMS Alert] SMS service not configured");
      return false;
    }

    try {
      const response = await this.smsService.sendSMS({
        to: testPhone,
        message: "Test SMS from Agent Banking System - SMS alerts are working!",
      });

      return response.success;
    } catch (error) {
      console.error("[SMS Alert] Test failed:", error);
      return false;
    }
  }
}

// Singleton instance
let smsAlertServiceInstance: SMSAlertService | null = null;

/**
 * Get or create SMS alert service instance
 */
export function getSMSAlertService(
  smsService?: AfricasTalkingSMSService
): SMSAlertService {
  if (!smsAlertServiceInstance) {
    smsAlertServiceInstance = new SMSAlertService(smsService);
  }
  return smsAlertServiceInstance;
}
