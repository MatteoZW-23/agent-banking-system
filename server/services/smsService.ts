import axios, { AxiosInstance } from "axios";

export interface SMSMessage {
  to: string;
  message: string;
  messageType?: "text" | "flash";
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  cost?: number;
  credits?: number;
}

export interface SMSDeliveryReport {
  messageId: string;
  phoneNumber: string;
  status: "Sent" | "Delivered" | "Failed" | "Rejected" | "Queued";
  timestamp: Date;
  cost: number;
}

/**
 * Africa's Talking SMS Service
 * Handles SMS sending and delivery tracking for alert notifications
 */
export class AfricasTalkingSMSService {
  private apiKey: string;
  private username: string;
  private apiClient: AxiosInstance;
  private baseUrl = "https://api.sandbox.africastalking.com/version1/messaging";
  private deliveryReports: Map<string, SMSDeliveryReport> = new Map();

  constructor(apiKey: string, username: string) {
    this.apiKey = apiKey;
    this.username = username;

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        apiKey: this.apiKey,
      },
      timeout: 10000,
    });
  }

  /**
   * Send a single SMS message
   */
  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    try {
      const params = new URLSearchParams({
        username: this.username,
        to: message.to,
        message: message.message,
        messageType: message.messageType || "text",
      });

      const response = await this.apiClient.post("/send", params.toString());

      if (response.data.SMSMessageData?.Recipients?.[0]) {
        const recipient = response.data.SMSMessageData.Recipients[0];
        return {
          success: recipient.status === "Success",
          messageId: recipient.messageId,
          status: recipient.status,
          cost: recipient.messageParts,
          credits: response.data.SMSMessageData.TotalCost,
        };
      }

      return {
        success: false,
        error: "Invalid response format from Africa's Talking",
      };
    } catch (error: any) {
      console.error("[SMS Service] Failed to send SMS:", error.message);
      return {
        success: false,
        error: error.message || "Failed to send SMS",
      };
    }
  }

  /**
   * Send bulk SMS messages
   */
  async sendBulkSMS(messages: SMSMessage[]): Promise<SMSResponse[]> {
    return Promise.all(messages.map(msg => this.sendSMS(msg)));
  }

  /**
   * Send alert SMS to multiple recipients
   */
  async sendAlertSMS(
    recipients: string[],
    alertType: string,
    message: string,
    priority: "low" | "medium" | "high" | "critical" = "high"
  ): Promise<SMSResponse[]> {
    const messageType = priority === "critical" ? "flash" : "text";

    const messages: SMSMessage[] = recipients.map(phone => ({
      to: phone,
      message: `[${alertType.toUpperCase()}] ${message}`,
      messageType,
    }));

    return this.sendBulkSMS(messages);
  }

  /**
   * Handle delivery report callback from Africa's Talking
   */
  handleDeliveryReport(data: any): void {
    try {
      const { id, phoneNumber, status, timestamp } = data;

      const report: SMSDeliveryReport = {
        messageId: id,
        phoneNumber,
        status: status as any,
        timestamp: new Date(timestamp),
        cost: 0,
      };

      this.deliveryReports.set(id, report);
      console.log(`[SMS Service] Delivery report received: ${id} - ${status}`);
    } catch (error) {
      console.error("[SMS Service] Failed to process delivery report:", error);
    }
  }

  /**
   * Get delivery status for a message
   */
  getDeliveryStatus(messageId: string): SMSDeliveryReport | undefined {
    return this.deliveryReports.get(messageId);
  }

  /**
   * Get all delivery reports
   */
  getAllDeliveryReports(): SMSDeliveryReport[] {
    return Array.from(this.deliveryReports.values());
  }

  /**
   * Clear old delivery reports (older than 7 days)
   */
  clearOldReports(daysOld: number = 7): number {
    const cutoffTime = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    let count = 0;

    const entriesToDelete: string[] = [];
    this.deliveryReports.forEach((report, messageId) => {
      if (report.timestamp < cutoffTime) {
        entriesToDelete.push(messageId);
      }
    });

    entriesToDelete.forEach(messageId => {
      this.deliveryReports.delete(messageId);
      count++;
    });

    return count;
  }

  /**
   * Test SMS service connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const testMessage: SMSMessage = {
        to: "+254700000000", // Test number
        message: "Test message from Agent Banking System",
      };

      const response = await this.sendSMS(testMessage);
      return response.success;
    } catch (error) {
      console.error("[SMS Service] Connection test failed:", error);
      return false;
    }
  }

  /**
   * Format phone number to international format
   */
  static formatPhoneNumber(phone: string): string {
    // Remove common formatting characters
    let cleaned = phone.replace(/[\s\-\(\)]/g, "");

    // Add + if not present
    if (!cleaned.startsWith("+")) {
      // Assume Zimbabwe country code if no prefix
      if (cleaned.startsWith("0")) {
        cleaned = "+263" + cleaned.substring(1);
      } else if (!cleaned.startsWith("263")) {
        cleaned = "+263" + cleaned;
      } else {
        cleaned = "+" + cleaned;
      }
    }

    return cleaned;
  }
}

// Singleton instance
let smsServiceInstance: AfricasTalkingSMSService | null = null;

/**
 * Get or create SMS service instance
 */
export function getSMSService(): AfricasTalkingSMSService {
  if (!smsServiceInstance) {
    const apiKey = process.env.AFRICAS_TALKING_API_KEY;
    const username = process.env.AFRICAS_TALKING_USERNAME;

    if (!apiKey || !username) {
      throw new Error("Africa's Talking credentials not configured");
    }

    smsServiceInstance = new AfricasTalkingSMSService(apiKey, username);
  }

  return smsServiceInstance;
}
