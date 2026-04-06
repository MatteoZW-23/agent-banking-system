import { describe, it, expect, beforeEach, vi } from "vitest";
import { AfricasTalkingSMSService, SMSMessage, SMSResponse } from "./smsService";

describe("AfricasTalkingSMSService", () => {
  let smsService: AfricasTalkingSMSService;

  beforeEach(() => {
    smsService = new AfricasTalkingSMSService("test-api-key", "test-username");
  });

  describe("formatPhoneNumber", () => {
    it("should format Zimbabwean phone number with 0 prefix", () => {
      const formatted = AfricasTalkingSMSService.formatPhoneNumber("0712345678");
      expect(formatted).toBe("+263712345678");
    });

    it("should format Zimbabwean phone number with country code", () => {
      const formatted = AfricasTalkingSMSService.formatPhoneNumber("263712345678");
      expect(formatted).toBe("+263712345678");
    });

    it("should keep already formatted international number", () => {
      const formatted = AfricasTalkingSMSService.formatPhoneNumber("+263712345678");
      expect(formatted).toBe("+263712345678");
    });

    it("should remove formatting characters", () => {
      const formatted = AfricasTalkingSMSService.formatPhoneNumber("+263 (71) 234-5678");
      expect(formatted).toBe("+263712345678");
    });
  });

  describe("clearOldReports", () => {
    it("should clear delivery reports older than specified days", () => {
      // Add a report from 8 days ago
      const oldReport = {
        messageId: "old-msg",
        phoneNumber: "+263712345678",
        status: "Delivered" as const,
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        cost: 1,
      };

      // Add a recent report
      const recentReport = {
        messageId: "recent-msg",
        phoneNumber: "+263712345678",
        status: "Delivered" as const,
        timestamp: new Date(),
        cost: 1,
      };

      smsService.handleDeliveryReport({
        id: oldReport.messageId,
        phoneNumber: oldReport.phoneNumber,
        status: oldReport.status,
        timestamp: oldReport.timestamp.toISOString(),
      });

      smsService.handleDeliveryReport({
        id: recentReport.messageId,
        phoneNumber: recentReport.phoneNumber,
        status: recentReport.status,
        timestamp: recentReport.timestamp.toISOString(),
      });

      const cleared = smsService.clearOldReports(7);
      expect(cleared).toBe(1);

      const remaining = smsService.getAllDeliveryReports();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].messageId).toBe("recent-msg");
    });
  });

  describe("getAllDeliveryReports", () => {
    it("should return all delivery reports", () => {
      smsService.handleDeliveryReport({
        id: "msg-1",
        phoneNumber: "+263712345678",
        status: "Delivered",
        timestamp: new Date().toISOString(),
      });

      smsService.handleDeliveryReport({
        id: "msg-2",
        phoneNumber: "+263712345679",
        status: "Failed",
        timestamp: new Date().toISOString(),
      });

      const reports = smsService.getAllDeliveryReports();
      expect(reports).toHaveLength(2);
      expect(reports[0].messageId).toBe("msg-1");
      expect(reports[1].messageId).toBe("msg-2");
    });
  });

  describe("getDeliveryStatus", () => {
    it("should return delivery status for a message", () => {
      smsService.handleDeliveryReport({
        id: "test-msg",
        phoneNumber: "+263712345678",
        status: "Delivered",
        timestamp: new Date().toISOString(),
      });

      const status = smsService.getDeliveryStatus("test-msg");
      expect(status).toBeDefined();
      expect(status?.status).toBe("Delivered");
      expect(status?.phoneNumber).toBe("+263712345678");
    });

    it("should return undefined for non-existent message", () => {
      const status = smsService.getDeliveryStatus("non-existent");
      expect(status).toBeUndefined();
    });
  });
});
