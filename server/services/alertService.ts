import { getDb } from "../db";
import { alertConfigurations, alertHistory } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export interface AlertNotification {
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  channels: string[];
  metadata?: Record<string, any>;
}

export class AlertService {
  checkAllThresholds: any;
  checkAllThresholds(): any {
    throw new Error("Method not implemented.");
  }
  /**
   * Create and trigger an alert
   */
  async triggerAlert(
    alertType: string,
    providerId: number | null,
    transactionId: number | null,
    title: string,
    message: string,
    severity: "low" | "medium" | "high" | "critical"
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      // Find alert configuration
      const configs = await db
        .select()
        .from(alertConfigurations)
        .where(
          and(
            eq(alertConfigurations.alertType, alertType as any),
            eq(alertConfigurations.isActive, true)
          )
        );

      if (configs.length === 0) return;

      const config = configs[0];

      // Create alert history record
      const alertRecord = await db.insert(alertHistory).values({
        alertConfigId: config.id,
        providerId,
        transactionId,
        title,
        message,
        severity: severity as any,
        status: "triggered",
        triggeredAt: new Date(),
      });

      // Send notifications
      const channels = config.notificationChannels as any;
      if (channels) {
        await this.sendNotifications(
          {
            title,
            message,
            severity,
            channels: channels.channels || [],
            metadata: { alertType, providerId, transactionId },
          },
          severity
        );
      }
    } catch (error) {
      console.error("[AlertService] Failed to trigger alert:", error);
    }
  }

  /**
   * Send notifications through configured channels
   */
  private async sendNotifications(
    notification: AlertNotification,
    severity: string
  ): Promise<void> {
    const channels = notification.channels || [];

    for (const channel of channels) {
      try {
        switch (channel) {
          case "sms":
            await this.sendSmsNotification(notification);
            break;
          case "email":
            await this.sendEmailNotification(notification);
            break;
          case "webhook":
            await this.sendWebhookNotification(notification);
            break;
          case "in_app":
            await this.createInAppNotification(notification);
            break;
        }
      } catch (error) {
        console.error(
          `[AlertService] Failed to send ${channel} notification:`,
          error
        );
      }
    }
  }

  /**
   * Send SMS notification using Africa's Talking or similar service
   */
  private async sendSmsNotification(
    notification: AlertNotification
  ): Promise<void> {
    const smsApiKey = process.env.SMS_API_KEY;
    const alertPhone = process.env.ALERT_PHONE;

    if (!smsApiKey || !alertPhone) {
      console.warn("[AlertService] SMS configuration not available");
      return;
    }

    const message = `${notification.title}: ${notification.message}`;

    try {
      // TODO: Integrate with SMS gateway (Africa's Talking / Twilio)
      console.log(`[Notification] Auto-alert to ${alertPhone}: ${message}`);

      // Example: Africa's Talking integration
      // const response = await fetch('https://api.sandbox.africastalking.com/version1/messaging', {
      //   method: 'POST',
      //   headers: {
      //     'Accept': 'application/json',
      //     'Content-Type': 'application/x-www-form-urlencoded',
      //     'apiKey': smsApiKey,
      //   },
      //   body: new URLSearchParams({
      //     username: 'sandbox',
      //     message: message,
      //     recipients: alertPhone,
      //   }).toString(),
      // });
    } catch (error) {
      console.error("[AlertService] SMS send failed:", error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    notification: AlertNotification
  ): Promise<void> {
    const emailService = process.env.EMAIL_SERVICE;

    if (!emailService) {
      console.warn("[AlertService] Email service not configured");
      return;
    }

    try {
      console.log(`[Email] Sending alert: ${notification.title}`);
      // Email service integration would go here
    } catch (error) {
      console.error("[AlertService] Email send failed:", error);
      throw error;
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    notification: AlertNotification
  ): Promise<void> {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn("[AlertService] Webhook URL not configured");
      return;
    }

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notification),
      });
    } catch (error) {
      console.error("[AlertService] Webhook send failed:", error);
      throw error;
    }
  }

  /**
   * Create in-app notification
   */
  private async createInAppNotification(
    notification: AlertNotification
  ): Promise<void> {
    // This would integrate with the notification API
    console.log(`[In-App] Alert: ${notification.title}`);
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    alertId: number,
    acknowledgedBy: number
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    await db
      .update(alertHistory)
      .set({
        status: "acknowledged",
        acknowledgedBy,
        acknowledgedAt: new Date(),
      })
      .where(eq(alertHistory.id, alertId));
  }

  /**
   * Get unacknowledged alerts
   */
  async getUnacknowledgedAlerts(limit = 50): Promise<any[]> {
    const db = await getDb();
    if (!db) return [];

    return await db
      .select()
      .from(alertHistory)
      .where(eq(alertHistory.status, "triggered"))
      .limit(limit);
  }

  /**
   * Check float thresholds and trigger alerts
   */
  async checkFloatThresholds(): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      const { providerFloats } = await import("../../drizzle/schema");
      const floats = await db.select().from(providerFloats);

      for (const float of floats) {
        const currentBalance =
          typeof float.currentBalance === "string"
            ? parseFloat(float.currentBalance)
            : (float.currentBalance as number);
        const minimumThreshold = float.minimumThreshold
          ? typeof float.minimumThreshold === "string"
            ? parseFloat(float.minimumThreshold)
            : (float.minimumThreshold as number)
          : 0;

        if (currentBalance < minimumThreshold) {
          await this.triggerAlert(
            "low_float",
            float.providerId,
            undefined as any,
            "Low Float Alert",
            `Float balance (${currentBalance}) is below minimum threshold (${minimumThreshold})`,
            "high"
          );
        }
      }
    } catch (error) {
      console.error("[AlertService] Float threshold check failed:", error);
    }
  }

  /**
   * Check for suspicious transaction patterns
   */
  async checkSuspiciousPatterns(): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      const { transactionFlags } = await import("../../drizzle/schema");
      const flaggedTxns = await db
        .select()
        .from(transactionFlags)
        .where(eq(transactionFlags.status, "flagged"));

      for (const flag of flaggedTxns) {
        const riskScore = flag.riskScore
          ? typeof flag.riskScore === "string"
            ? parseFloat(flag.riskScore)
            : (flag.riskScore as number)
          : 0;

        if (riskScore > 0.7) {
          await this.triggerAlert(
            "suspicious_transaction",
            undefined as any,
            flag.transactionId,
            "Suspicious Transaction Detected",
            `High-risk transaction flagged: ${flag.reason}`,
            "critical"
          );
        }
      }
    } catch (error) {
      console.error("[AlertService] Suspicious pattern check failed:", error);
    }
  }
}

export const alertService = new AlertService();
