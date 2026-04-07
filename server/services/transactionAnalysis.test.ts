import { describe, it, expect, beforeEach, vi } from "vitest";
import { transactionAnalysisService } from "./transactionAnalysis";
import { getDb } from "../db";

vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

describe("Transaction Analysis Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Risk Score Calculation", () => {
    it("should assign low risk score for normal transactions", () => {
      const transaction = {
        amount: 500.0,
        type: "cash_out" as const,
        frequency: "normal",
        customerNew: false,
        timeOfDay: "business_hours",
      };

      const riskScore =
        transactionAnalysisService.calculateRiskScore(transaction);

      expect(riskScore).toBeGreaterThanOrEqual(0.0);
      expect(riskScore).toBeLessThan(0.3);
    });

    it("should assign medium risk score for unusual transactions", () => {
      const transaction = {
        amount: 5000.0,
        type: "send_money" as const,
        frequency: "unusual",
        customerNew: false,
        timeOfDay: "off_hours",
      };

      const riskScore =
        transactionAnalysisService.calculateRiskScore(transaction);

      expect(riskScore).toBeGreaterThanOrEqual(0.3);
      expect(riskScore).toBeLessThan(0.7);
    });

    it("should assign high risk score for suspicious transactions", () => {
      const transaction = {
        amount: 50000.0,
        type: "send_money" as const,
        frequency: "first_time",
        customerNew: true,
        timeOfDay: "late_night",
      };

      const riskScore =
        transactionAnalysisService.calculateRiskScore(transaction);

      expect(riskScore).toBeGreaterThanOrEqual(0.7);
      expect(riskScore).toBeLessThanOrEqual(1.0);
    });
  });

  describe("Amount Anomaly Detection", () => {
    it("should detect unusually high amounts", () => {
      const transaction = {
        amount: 50000.0,
        averageAmount: 1000.0,
      };

      const isAnomaly = transactionAnalysisService.isAmountAnomaly(transaction);
      expect(isAnomaly).toBe(true);
    });

    it("should not flag normal amounts", () => {
      const transaction = {
        amount: 1200.0,
        averageAmount: 1000.0,
      };

      const isAnomaly = transactionAnalysisService.isAmountAnomaly(transaction);
      expect(isAnomaly).toBe(false);
    });

    it("should handle zero average amount", () => {
      const transaction = {
        amount: 100.0,
        averageAmount: 0.0,
      };

      const isAnomaly = transactionAnalysisService.isAmountAnomaly(transaction);
      expect(isAnomaly).toBe(true); // Any transaction with zero average is anomalous
    });

    it("should calculate deviation percentage correctly", () => {
      const transaction = {
        amount: 2000.0,
        averageAmount: 1000.0,
      };

      const deviation =
        transactionAnalysisService.getAmountDeviation(transaction);
      expect(deviation).toBe(100); // 100% above average
    });
  });

  describe("Frequency Pattern Analysis", () => {
    it("should detect rapid-fire transactions", () => {
      const transactions = [
        { timestamp: new Date(Date.now() - 60000) }, // 1 minute ago
        { timestamp: new Date(Date.now() - 30000) }, // 30 seconds ago
        { timestamp: new Date(Date.now()) }, // now
      ];

      const isRapidFire =
        transactionAnalysisService.isRapidFirePattern(transactions);
      expect(isRapidFire).toBe(true);
    });

    it("should not flag normal transaction frequency", () => {
      const transactions = [
        { timestamp: new Date(Date.now() - 3600000) }, // 1 hour ago
        { timestamp: new Date(Date.now() - 1800000) }, // 30 minutes ago
        { timestamp: new Date(Date.now()) }, // now
      ];

      const isRapidFire =
        transactionAnalysisService.isRapidFirePattern(transactions);
      expect(isRapidFire).toBe(false);
    });

    it("should handle single transaction", () => {
      const transactions = [{ timestamp: new Date() }];

      const isRapidFire =
        transactionAnalysisService.isRapidFirePattern(transactions);
      expect(isRapidFire).toBe(false);
    });
  });

  describe("Customer Behavior Analysis", () => {
    it("should flag new customer transactions", () => {
      const transaction = {
        customerId: "NEW_CUST_001",
        isNewCustomer: true,
        accountAge: 0,
      };

      const isAnomalous =
        transactionAnalysisService.isNewCustomerAnomaly(transaction);
      expect(isAnomalous).toBe(true);
    });

    it("should not flag established customers", () => {
      const transaction = {
        customerId: "CUST_001",
        isNewCustomer: false,
        accountAge: 365,
      };

      const isAnomalous =
        transactionAnalysisService.isNewCustomerAnomaly(transaction);
      expect(isAnomalous).toBe(false);
    });

    it("should flag first-time transaction types for customer", () => {
      const transaction = {
        customerId: "CUST_001",
        transactionType: "send_money",
        hasPerformedBefore: false,
      };

      const isFirstTime =
        transactionAnalysisService.isFirstTimeTransaction(transaction);
      expect(isFirstTime).toBe(true);
    });
  });

  describe("Temporal Pattern Analysis", () => {
    it("should flag off-hours transactions", () => {
      const transaction = {
        timestamp: new Date("2026-04-06T02:00:00"), // 2 AM
      };

      const isOffHours =
        transactionAnalysisService.isOffHoursTransaction(transaction);
      expect(isOffHours).toBe(true);
    });

    it("should not flag business hours transactions", () => {
      const transaction = {
        timestamp: new Date("2026-04-06T14:00:00"), // 2 PM
      };

      const isOffHours =
        transactionAnalysisService.isOffHoursTransaction(transaction);
      expect(isOffHours).toBe(false);
    });

    it("should flag weekend transactions", () => {
      const transaction = {
        timestamp: new Date("2026-04-05T14:00:00"), // Saturday
      };

      const isWeekend =
        transactionAnalysisService.isWeekendTransaction(transaction);
      expect(isWeekend).toBe(true);
    });

    it("should not flag weekday transactions", () => {
      const transaction = {
        timestamp: new Date("2026-04-07T14:00:00"), // Monday
      };

      const isWeekend =
        transactionAnalysisService.isWeekendTransaction(transaction);
      expect(isWeekend).toBe(false);
    });
  });

  describe("Cross-Provider Pattern Detection", () => {
    it("should detect coordinated transactions across providers", () => {
      const transactions = [
        {
          providerId: 1,
          amount: 5000.0,
          timestamp: new Date(Date.now() - 60000),
        },
        {
          providerId: 2,
          amount: 5000.0,
          timestamp: new Date(Date.now() - 30000),
        },
        { providerId: 3, amount: 5000.0, timestamp: new Date(Date.now()) },
      ];

      const isCoordinated =
        transactionAnalysisService.isCoordinatedPattern(transactions);
      expect(isCoordinated).toBe(true);
    });

    it("should not flag normal multi-provider transactions", () => {
      const transactions = [
        {
          providerId: 1,
          amount: 1000.0,
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          providerId: 2,
          amount: 2000.0,
          timestamp: new Date(Date.now() - 1800000),
        },
        { providerId: 3, amount: 500.0, timestamp: new Date(Date.now()) },
      ];

      const isCoordinated =
        transactionAnalysisService.isCoordinatedPattern(transactions);
      expect(isCoordinated).toBe(false);
    });
  });

  describe("Risk Classification", () => {
    it("should classify low risk transactions", () => {
      const riskScore = 0.2;
      const classification = transactionAnalysisService.classifyRisk(riskScore);

      expect(classification).toBe("low");
    });

    it("should classify medium risk transactions", () => {
      const riskScore = 0.5;
      const classification = transactionAnalysisService.classifyRisk(riskScore);

      expect(classification).toBe("medium");
    });

    it("should classify high risk transactions", () => {
      const riskScore = 0.85;
      const classification = transactionAnalysisService.classifyRisk(riskScore);

      expect(classification).toBe("high");
    });

    it("should handle boundary values", () => {
      expect(transactionAnalysisService.classifyRisk(0.0)).toBe("low");
      expect(transactionAnalysisService.classifyRisk(0.3)).toBe("medium");
      expect(transactionAnalysisService.classifyRisk(0.7)).toBe("high");
      expect(transactionAnalysisService.classifyRisk(1.0)).toBe("high");
    });
  });

  describe("Flag Generation", () => {
    it("should generate flag for high-risk transaction", () => {
      const transaction = {
        id: 1,
        riskScore: 0.85,
        reasons: ["New customer", "Off-hours transaction", "Unusual amount"],
      };

      const flag = transactionAnalysisService.generateFlag(transaction);

      expect(flag.transactionId).toBe(1);
      expect(flag.riskScore).toBe(0.85);
      expect(flag.status).toBe("flagged");
      expect(flag.reasons).toContain("New customer");
    });

    it("should include timestamp in flag", () => {
      const transaction = {
        id: 1,
        riskScore: 0.75,
        reasons: ["Suspicious pattern"],
      };

      const flag = transactionAnalysisService.generateFlag(transaction);

      expect(flag.flaggedAt).toBeInstanceOf(Date);
    });

    it("should include recommendation in flag", () => {
      const transaction = {
        id: 1,
        riskScore: 0.9,
        reasons: ["Multiple red flags"],
      };

      const flag = transactionAnalysisService.generateFlag(transaction);

      expect(flag.recommendation).toBeDefined();
      expect(["review", "investigate", "block"]).toContain(flag.recommendation);
    });
  });
});
