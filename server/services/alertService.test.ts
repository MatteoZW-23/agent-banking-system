import { describe, it, expect, beforeEach, vi } from "vitest";
import { alertService } from "./alertService";
import { getDb } from "../db";

vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

describe("Alert Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Alert Severity Classification", () => {
    it("should classify critical discrepancies", () => {
      const alert = {
        type: "discrepancy" as const,
        value: 150.0,
        threshold: 100.0,
      };

      const severity = alertService.classifySeverity(alert);
      expect(severity).toBe("critical");
    });

    it("should classify high severity alerts", () => {
      const alert = {
        type: "discrepancy" as const,
        value: 75.0,
        threshold: 50.0,
      };

      const severity = alertService.classifySeverity(alert);
      expect(severity).toBe("high");
    });

    it("should classify medium severity alerts", () => {
      const alert = {
        type: "low_float" as const,
        value: 600.0,
        threshold: 500.0,
      };

      const severity = alertService.classifySeverity(alert);
      expect(severity).toBe("medium");
    });

    it("should classify low severity alerts", () => {
      const alert = {
        type: "suspicious_transaction" as const,
        value: 0.5,
        threshold: 0.7,
      };

      const severity = alertService.classifySeverity(alert);
      expect(severity).toBe("low");
    });
  });

  describe("Alert Triggering", () => {
    it("should trigger alert when value exceeds threshold", () => {
      const shouldTrigger = alertService.shouldTriggerAlert(150.0, 100.0);
      expect(shouldTrigger).toBe(true);
    });

    it("should not trigger alert when value is below threshold", () => {
      const shouldTrigger = alertService.shouldTriggerAlert(75.0, 100.0);
      expect(shouldTrigger).toBe(false);
    });

    it("should trigger alert at exact threshold", () => {
      const shouldTrigger = alertService.shouldTriggerAlert(100.0, 100.0);
      expect(shouldTrigger).toBe(true);
    });

    it("should handle zero threshold", () => {
      const shouldTrigger = alertService.shouldTriggerAlert(0.1, 0.0);
      expect(shouldTrigger).toBe(true);
    });
  });

  describe("Float Threshold Checks", () => {
    it("should detect low float condition", () => {
      const floatBalance = 400.0;
      const minimumThreshold = 500.0;

      const isLow = alertService.isFloatLow(floatBalance, minimumThreshold);
      expect(isLow).toBe(true);
    });

    it("should not alert for normal float", () => {
      const floatBalance = 5000.0;
      const minimumThreshold = 500.0;

      const isLow = alertService.isFloatLow(floatBalance, minimumThreshold);
      expect(isLow).toBe(false);
    });

    it("should detect high float condition", () => {
      const floatBalance = 60000.0;
      const maximumThreshold = 50000.0;

      const isHigh = alertService.isFloatHigh(floatBalance, maximumThreshold);
      expect(isHigh).toBe(true);
    });

    it("should not alert for normal high float", () => {
      const floatBalance = 30000.0;
      const maximumThreshold = 50000.0;

      const isHigh = alertService.isFloatHigh(floatBalance, maximumThreshold);
      expect(isHigh).toBe(false);
    });
  });

  describe("Suspicious Pattern Detection", () => {
    it("should detect high-risk transactions", () => {
      const transaction = {
        riskScore: 0.85,
        threshold: 0.7,
      };

      const isSuspicious = alertService.isSuspiciousTransaction(transaction);
      expect(isSuspicious).toBe(true);
    });

    it("should not flag low-risk transactions", () => {
      const transaction = {
        riskScore: 0.4,
        threshold: 0.7,
      };

      const isSuspicious = alertService.isSuspiciousTransaction(transaction);
      expect(isSuspicious).toBe(false);
    });

    it("should handle edge case at threshold", () => {
      const transaction = {
        riskScore: 0.7,
        threshold: 0.7,
      };

      const isSuspicious = alertService.isSuspiciousTransaction(transaction);
      expect(isSuspicious).toBe(true);
    });
  });

  describe("Alert Deduplication", () => {
    it("should prevent duplicate alerts within time window", () => {
      const now = new Date();
      const recentAlert = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago

      const isDuplicate = alertService.isDuplicateAlert(recentAlert, 10); // 10 minute window
      expect(isDuplicate).toBe(true);
    });

    it("should allow alerts outside time window", () => {
      const now = new Date();
      const oldAlert = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes ago

      const isDuplicate = alertService.isDuplicateAlert(oldAlert, 10); // 10 minute window
      expect(isDuplicate).toBe(false);
    });

    it("should handle very recent alerts", () => {
      const now = new Date();
      const veryRecent = new Date(now.getTime() - 1000); // 1 second ago

      const isDuplicate = alertService.isDuplicateAlert(veryRecent, 1); // 1 minute window
      expect(isDuplicate).toBe(true);
    });
  });

  describe("Alert Acknowledgment", () => {
    it("should mark alert as acknowledged", () => {
      const alert = {
        id: 1,
        acknowledged: false,
        acknowledgedBy: null,
        acknowledgedAt: null,
      };

      const updated = alertService.acknowledgeAlert(alert, 5);

      expect(updated.acknowledged).toBe(true);
      expect(updated.acknowledgedBy).toBe(5);
      expect(updated.acknowledgedAt).toBeInstanceOf(Date);
    });

    it("should prevent re-acknowledgment", () => {
      const alert = {
        id: 1,
        acknowledged: true,
        acknowledgedBy: 5,
        acknowledgedAt: new Date(),
      };

      const canAcknowledge = alertService.canAcknowledge(alert);
      expect(canAcknowledge).toBe(false);
    });

    it("should allow acknowledgment of new alerts", () => {
      const alert = {
        id: 1,
        acknowledged: false,
        acknowledgedBy: null,
        acknowledgedAt: null,
      };

      const canAcknowledge = alertService.canAcknowledge(alert);
      expect(canAcknowledge).toBe(true);
    });
  });

  describe("Alert Routing", () => {
    it("should route critical alerts to SMS", () => {
      const alert = {
        severity: "critical" as const,
        type: "discrepancy" as const,
      };

      const shouldSendSMS = alertService.shouldSendSMS(alert);
      expect(shouldSendSMS).toBe(true);
    });

    it("should route high alerts to SMS", () => {
      const alert = {
        severity: "high" as const,
        type: "low_float" as const,
      };

      const shouldSendSMS = alertService.shouldSendSMS(alert);
      expect(shouldSendSMS).toBe(true);
    });

    it("should not route low alerts to SMS", () => {
      const alert = {
        severity: "low" as const,
        type: "suspicious_transaction" as const,
      };

      const shouldSendSMS = alertService.shouldSendSMS(alert);
      expect(shouldSendSMS).toBe(false);
    });

    it("should route all alerts to dashboard", () => {
      const severities = ["critical", "high", "medium", "low"] as const;

      severities.forEach((severity) => {
        const alert = { severity, type: "discrepancy" as const };
        expect(alertService.shouldShowInDashboard(alert)).toBe(true);
      });
    });
  });

  describe("Alert Message Generation", () => {
    it("should generate discrepancy alert message", () => {
      const alert = {
        type: "discrepancy" as const,
        value: 150.0,
        providerId: 1,
        providerName: "EcoCash",
      };

      const message = alertService.generateAlertMessage(alert);
      expect(message).toContain("discrepancy");
      expect(message).toContain("150");
      expect(message).toContain("EcoCash");
    });

    it("should generate low float alert message", () => {
      const alert = {
        type: "low_float" as const,
        value: 400.0,
        providerId: 2,
        providerName: "OneMoney",
      };

      const message = alertService.generateAlertMessage(alert);
      expect(message).toContain("float");
      expect(message).toContain("400");
      expect(message).toContain("OneMoney");
    });

    it("should generate suspicious transaction alert message", () => {
      const alert = {
        type: "suspicious_transaction" as const,
        value: 0.85,
        transactionId: 123,
        riskLevel: "high",
      };

      const message = alertService.generateAlertMessage(alert);
      expect(message).toContain("suspicious");
      expect(message).toContain("high");
    });
  });
});
