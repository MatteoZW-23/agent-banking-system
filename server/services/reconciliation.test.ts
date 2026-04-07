import { describe, it, expect, beforeEach, vi } from "vitest";
import { reconciliationEngine } from "./reconciliation";
import { getDb } from "../db";

// Mock database
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

describe("Reconciliation Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Transaction Matching", () => {
    it("should match transactions with exact amount and reference", () => {
      const internal = [
        {
          id: 1,
          providerReference: "TXN001",
          amount: "100.00",
          transactionTime: new Date("2026-04-06"),
          status: "completed",
        },
      ];

      const external = [
        {
          id: "EXT001",
          reference: "TXN001",
          amount: 100.0,
          timestamp: new Date("2026-04-06"),
          status: "completed",
        },
      ];

      const matches = reconciliationEngine.matchTransactions(
        internal,
        external
      );
      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual({
        internal: internal[0],
        external: external[0],
        matchType: "exact",
      });
    });

    it("should handle amount tolerance for floating point differences", () => {
      const internal = [
        {
          id: 1,
          providerReference: "TXN001",
          amount: "100.00",
          transactionTime: new Date("2026-04-06"),
          status: "completed",
        },
      ];

      const external = [
        {
          id: "EXT001",
          reference: "TXN001",
          amount: 100.01, // 1 cent difference
          timestamp: new Date("2026-04-06"),
          status: "completed",
        },
      ];

      const matches = reconciliationEngine.matchTransactions(
        internal,
        external
      );
      expect(matches).toHaveLength(1);
      expect(matches[0]?.matchType).toBe("tolerance");
    });

    it("should detect unmatched internal transactions", () => {
      const internal = [
        {
          id: 1,
          providerReference: "TXN001",
          amount: "100.00",
          transactionTime: new Date("2026-04-06"),
          status: "completed",
        },
        {
          id: 2,
          providerReference: "TXN002",
          amount: "200.00",
          transactionTime: new Date("2026-04-06"),
          status: "completed",
        },
      ];

      const external = [
        {
          id: "EXT001",
          reference: "TXN001",
          amount: 100.0,
          timestamp: new Date("2026-04-06"),
          status: "completed",
        },
      ];

      const result = reconciliationEngine.reconcileTransactions(
        internal,
        external
      );
      expect(result.missingExternal).toHaveLength(1);
      expect(result.missingExternal[0]?.providerReference).toBe("TXN002");
    });

    it("should detect unmatched external transactions", () => {
      const internal = [
        {
          id: 1,
          providerReference: "TXN001",
          amount: "100.00",
          transactionTime: new Date("2026-04-06"),
          status: "completed",
        },
      ];

      const external = [
        {
          id: "EXT001",
          reference: "TXN001",
          amount: 100.0,
          timestamp: new Date("2026-04-06"),
          status: "completed",
        },
        {
          id: "EXT002",
          reference: "TXN003",
          amount: 300.0,
          timestamp: new Date("2026-04-06"),
          status: "completed",
        },
      ];

      const result = reconciliationEngine.reconcileTransactions(
        internal,
        external
      );
      expect(result.missingInternal).toHaveLength(1);
      expect(result.missingInternal[0]?.reference).toBe("TXN003");
    });

    it("should detect amount mismatches", () => {
      const internal = [
        {
          id: 1,
          providerReference: "TXN001",
          amount: "100.00",
          transactionTime: new Date("2026-04-06"),
          status: "completed",
        },
      ];

      const external = [
        {
          id: "EXT001",
          reference: "TXN001",
          amount: 150.0, // Different amount
          timestamp: new Date("2026-04-06"),
          status: "completed",
        },
      ];

      const result = reconciliationEngine.reconcileTransactions(
        internal,
        external
      );
      expect(result.mismatches).toHaveLength(1);
      expect(result.mismatches[0]?.discrepancy).toBe(50.0);
    });

    it("should calculate discrepancy percentage correctly", () => {
      const internal = [
        {
          id: 1,
          providerReference: "TXN001",
          amount: "100.00",
          transactionTime: new Date("2026-04-06"),
          status: "completed",
        },
      ];

      const external = [
        {
          id: "EXT001",
          reference: "TXN001",
          amount: 110.0, // 10% difference
          timestamp: new Date("2026-04-06"),
          status: "completed",
        },
      ];

      const result = reconciliationEngine.reconcileTransactions(
        internal,
        external
      );
      expect(result.mismatches).toHaveLength(1);
      expect(result.mismatches[0]?.discrepancyPercentage).toBeCloseTo(10);
    });
  });

  describe("Discrepancy Detection", () => {
    it("should classify critical discrepancies (> $100)", () => {
      const mismatch = {
        internalId: 1,
        externalId: "EXT001",
        discrepancy: 150.0,
        discrepancyPercentage: 15,
      };

      const severity = reconciliationEngine.getDiscrepancySeverity(mismatch);
      expect(severity).toBe("critical");
    });

    it("should classify high discrepancies ($50-$100)", () => {
      const mismatch = {
        internalId: 1,
        externalId: "EXT001",
        discrepancy: 75.0,
        discrepancyPercentage: 7.5,
      };

      const severity = reconciliationEngine.getDiscrepancySeverity(mismatch);
      expect(severity).toBe("high");
    });

    it("should classify medium discrepancies ($10-$50)", () => {
      const mismatch = {
        internalId: 1,
        externalId: "EXT001",
        discrepancy: 25.0,
        discrepancyPercentage: 2.5,
      };

      const severity = reconciliationEngine.getDiscrepancySeverity(mismatch);
      expect(severity).toBe("medium");
    });

    it("should classify low discrepancies (< $10)", () => {
      const mismatch = {
        internalId: 1,
        externalId: "EXT001",
        discrepancy: 5.0,
        discrepancyPercentage: 0.5,
      };

      const severity = reconciliationEngine.getDiscrepancySeverity(mismatch);
      expect(severity).toBe("low");
    });
  });

  describe("Reconciliation Summary", () => {
    it("should calculate correct totals", () => {
      const internal = [
        {
          id: 1,
          providerReference: "TXN001",
          amount: "100.00",
          transactionTime: new Date(),
          status: "completed",
        },
        {
          id: 2,
          providerReference: "TXN002",
          amount: "200.00",
          transactionTime: new Date(),
          status: "completed",
        },
        {
          id: 3,
          providerReference: "TXN003",
          amount: "300.00",
          transactionTime: new Date(),
          status: "completed",
        },
      ];

      const external = [
        {
          id: "EXT001",
          reference: "TXN001",
          amount: 100.0,
          timestamp: new Date(),
          status: "completed",
        },
        {
          id: "EXT002",
          reference: "TXN002",
          amount: 200.0,
          timestamp: new Date(),
          status: "completed",
        },
      ];

      const result = reconciliationEngine.reconcileTransactions(
        internal,
        external
      );
      expect(result.internalTotal).toBe(600.0);
      expect(result.externalTotal).toBe(300.0);
      expect(result.totalDiscrepancy).toBe(300.0);
    });

    it("should generate summary with status", () => {
      const internal = [
        {
          id: 1,
          providerReference: "TXN001",
          amount: "100.00",
          transactionTime: new Date(),
          status: "completed",
        },
      ];

      const external = [
        {
          id: "EXT001",
          reference: "TXN001",
          amount: 100.0,
          timestamp: new Date(),
          status: "completed",
        },
      ];

      const result = reconciliationEngine.reconcileTransactions(
        internal,
        external
      );
      expect(result.status).toBe("reconciled");
      expect(result.matchedCount).toBe(1);
      expect(result.unmatchedCount).toBe(0);
    });

    it("should mark as investigating when discrepancies exist", () => {
      const internal = [
        {
          id: 1,
          providerReference: "TXN001",
          amount: "100.00",
          transactionTime: new Date(),
          status: "completed",
        },
      ];

      const external = [
        {
          id: "EXT001",
          reference: "TXN001",
          amount: 150.0,
          timestamp: new Date(),
          status: "completed",
        },
      ];

      const result = reconciliationEngine.reconcileTransactions(
        internal,
        external
      );
      expect(result.status).toBe("investigating");
    });
  });
});
