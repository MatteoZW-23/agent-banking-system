import { describe, it, expect, beforeEach, vi } from "vitest";
import { SMSAlertService } from "./smsAlertService";
import { AfricasTalkingSMSService } from "./smsService";

describe("SMSAlertService", () => {
  let smsAlertService: SMSAlertService;
  let mockSmsService: Partial<AfricasTalkingSMSService>;

  beforeEach(() => {
    mockSmsService = {
      sendAlertSMS: vi.fn().mockResolvedValue([
        { success: true, messageId: "msg-1" },
        { success: true, messageId: "msg-2" },
      ]),
      sendSMS: vi.fn().mockResolvedValue({ success: true, messageId: "test-msg" }),
    };

    smsAlertService = new SMSAlertService(mockSmsService as AfricasTalkingSMSService);
  });

  describe("configuration", () => {
    it("should load default configuration", () => {
      const config = smsAlertService.getConfiguration();
      expect(config.enabled).toBe(false);
      expect(config.minSeverity).toBe("high");
    });

    it("should update configuration", () => {
      smsAlertService.updateConfiguration({
        enabled: true,
        phoneNumbers: ["+263712345678"],
        minSeverity: "medium",
      });

      const config = smsAlertService.getConfiguration();
      expect(config.enabled).toBe(true);
      expect(config.phoneNumbers).toContain("+263712345678");
      expect(config.minSeverity).toBe("medium");
    });
  });

  describe("shouldSendSMS", () => {
    it("should not send SMS when disabled", async () => {
      smsAlertService.updateConfiguration({ enabled: false });

      const result = await smsAlertService.sendAlertSMS(
        1,
        "discrepancy",
        "Large discrepancy detected",
        "high"
      );

      expect(result).toBe(false);
    });

    it("should respect minimum severity level", async () => {
      smsAlertService.updateConfiguration({
        enabled: true,
        phoneNumbers: ["+263712345678"],
        minSeverity: "high",
        alertTypes: ["discrepancy"],
      });

      // Low severity should not trigger
      const result = await smsAlertService.sendAlertSMS(
        1,
        "discrepancy",
        "Low severity alert",
        "low"
      );

      expect(result).toBe(false);
    });

    it("should send SMS for matching alert type and severity", async () => {
      smsAlertService.updateConfiguration({
        enabled: true,
        phoneNumbers: ["+263712345678"],
        minSeverity: "high",
        alertTypes: ["discrepancy"],
      });

      const result = await smsAlertService.sendAlertSMS(
        1,
        "discrepancy",
        "Large discrepancy detected",
        "critical"
      );

      expect(result).toBe(true);
      expect(mockSmsService.sendAlertSMS).toHaveBeenCalled();
    });

    it("should not send SMS for non-configured alert type", async () => {
      smsAlertService.updateConfiguration({
        enabled: true,
        phoneNumbers: ["+263712345678"],
        minSeverity: "high",
        alertTypes: ["discrepancy"],
      });

      const result = await smsAlertService.sendAlertSMS(
        1,
        "suspicious_transaction",
        "Suspicious transaction detected",
        "high"
      );

      expect(result).toBe(false);
    });
  });

  describe("testService", () => {
    it("should test SMS service connectivity", async () => {
      smsAlertService.updateConfiguration({
        enabled: true,
        phoneNumbers: ["+263712345678"],
      });

      const result = await smsAlertService.testService("+263712345678");

      expect(result).toBe(true);
      expect(mockSmsService.sendSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "+263712345678",
          message: expect.stringContaining("Test SMS"),
        })
      );
    });

    it("should return false when service is not configured", async () => {
      const result = await smsAlertService.testService("+263712345678");
      expect(result).toBe(false);
    });
  });
});
