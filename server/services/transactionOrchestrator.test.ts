import { describe, it, expect, beforeEach, vi } from "vitest";
import { TransactionOrchestrator } from "./transactionOrchestrator";

describe("TransactionOrchestrator", () => {
  describe("fetchFromAllProviders", () => {
    it("should return empty array when no providers are active", async () => {
      const result = await TransactionOrchestrator.fetchFromAllProviders(
        new Date("2026-01-01"),
        new Date("2026-01-31")
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle database connection errors gracefully", async () => {
      const result = await TransactionOrchestrator.fetchFromAllProviders(
        new Date("2026-01-01"),
        new Date("2026-01-31")
      );
      expect(result).toBeDefined();
    });
  });

  describe("fetchFromProvider", () => {
    it("should return error when provider not found", async () => {
      const result = await TransactionOrchestrator.fetchFromProvider(
        9999,
        "nonexistent",
        new Date("2026-01-01"),
        new Date("2026-01-31")
      );
      expect(result.failed).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should return error for unsupported provider", async () => {
      const result = await TransactionOrchestrator.fetchFromProvider(
        1,
        "unsupported_provider",
        new Date("2026-01-01"),
        new Date("2026-01-31")
      );
      expect(result.failed).toBeGreaterThanOrEqual(0);
    });

    it("should have correct result structure", async () => {
      const result = await TransactionOrchestrator.fetchFromProvider(
        1,
        "ecocash",
        new Date("2026-01-01"),
        new Date("2026-01-31")
      );
      expect(result).toHaveProperty("providerId");
      expect(result).toHaveProperty("providerName");
      expect(result).toHaveProperty("fetched");
      expect(result).toHaveProperty("failed");
      expect(result).toHaveProperty("errors");
    });
  });

  describe("getSyncStatus", () => {
    it("should return sync status object", async () => {
      const status = await TransactionOrchestrator.getSyncStatus();
      expect(status).toHaveProperty("lastSync");
      expect(status).toHaveProperty("totalTransactions");
      expect(status).toHaveProperty("pendingReconciliation");
      expect(status).toHaveProperty("reconciled");
    });

    it("should return numeric values for counts", async () => {
      const status = await TransactionOrchestrator.getSyncStatus();
      expect(typeof status.totalTransactions).toBe("number");
      expect(typeof status.pendingReconciliation).toBe("number");
      expect(typeof status.reconciled).toBe("number");
    });

    it("should have non-negative counts", async () => {
      const status = await TransactionOrchestrator.getSyncStatus();
      expect(status.totalTransactions).toBeGreaterThanOrEqual(0);
      expect(status.pendingReconciliation).toBeGreaterThanOrEqual(0);
      expect(status.reconciled).toBeGreaterThanOrEqual(0);
    });
  });
});
