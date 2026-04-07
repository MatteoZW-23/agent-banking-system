import { describe, it, expect, beforeEach, vi } from "vitest";
import { commissionService } from "./commissionService";
import { getDb } from "../db";

vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

describe("Commission Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Commission Calculation", () => {
    it("should calculate commission based on rate", () => {
      const transaction = {
        amount: 1000.0,
        fee: 25.0,
        type: "cash_out" as const,
      };

      const rate = 2.5; // 2.5%
      const commission = commissionService.calculateCommission(
        transaction,
        rate
      );

      // Commission = (Amount - Fee) * Rate / 100
      const expected = (1000.0 - 25.0) * (2.5 / 100);
      expect(commission).toBeCloseTo(expected, 2);
    });

    it("should handle zero fee transactions", () => {
      const transaction = {
        amount: 500.0,
        fee: 0,
        type: "cash_in" as const,
      };

      const rate = 1.5;
      const commission = commissionService.calculateCommission(
        transaction,
        rate
      );

      const expected = 500.0 * (1.5 / 100);
      expect(commission).toBeCloseTo(expected, 2);
    });

    it("should return zero commission for zero rate", () => {
      const transaction = {
        amount: 1000.0,
        fee: 25.0,
        type: "cash_out" as const,
      };

      const rate = 0;
      const commission = commissionService.calculateCommission(
        transaction,
        rate
      );

      expect(commission).toBe(0);
    });

    it("should handle large amounts correctly", () => {
      const transaction = {
        amount: 100000.0,
        fee: 500.0,
        type: "bank_transfer" as const,
      };

      const rate = 1.0;
      const commission = commissionService.calculateCommission(
        transaction,
        rate
      );

      const expected = (100000.0 - 500.0) * (1.0 / 100);
      expect(commission).toBeCloseTo(expected, 2);
    });
  });

  describe("Commission Aggregation", () => {
    it("should aggregate commissions by transaction type", () => {
      const transactions = [
        {
          amount: 1000.0,
          fee: 25.0,
          type: "cash_out" as const,
          employeeCode: "EMP001",
        },
        {
          amount: 500.0,
          fee: 10.0,
          type: "cash_out" as const,
          employeeCode: "EMP001",
        },
        {
          amount: 2000.0,
          fee: 50.0,
          type: "send_money" as const,
          employeeCode: "EMP001",
        },
      ];

      const rates = {
        cash_out: 2.5,
        send_money: 3.0,
      };

      const aggregated = commissionService.aggregateByType(transactions, rates);

      expect(aggregated.cash_out).toBeCloseTo(
        (1000 - 25) * 0.025 + (500 - 10) * 0.025,
        2
      );
      expect(aggregated.send_money).toBeCloseTo((2000 - 50) * 0.03, 2);
    });

    it("should aggregate commissions by provider", () => {
      const transactions = [
        { amount: 1000.0, fee: 25.0, type: "cash_out" as const, providerId: 1 },
        { amount: 500.0, fee: 10.0, type: "cash_out" as const, providerId: 2 },
        { amount: 2000.0, fee: 50.0, type: "cash_out" as const, providerId: 1 },
      ];

      const rate = 2.5;
      const aggregated = commissionService.aggregateByProvider(
        transactions,
        rate
      );

      expect(aggregated[1]).toBeCloseTo(
        (1000 - 25) * 0.025 + (2000 - 50) * 0.025,
        2
      );
      expect(aggregated[2]).toBeCloseTo((500 - 10) * 0.025, 2);
    });

    it("should handle empty transaction list", () => {
      const transactions: any[] = [];
      const rates = { cash_out: 2.5 };

      const aggregated = commissionService.aggregateByType(transactions, rates);

      expect(Object.keys(aggregated).length).toBe(0);
    });
  });

  describe("Commission Report", () => {
    it("should identify top performers", () => {
      const commissions = [
        { employeeCode: "EMP001", totalCommission: 5000.0 },
        { employeeCode: "EMP002", totalCommission: 3000.0 },
        { employeeCode: "EMP003", totalCommission: 7000.0 },
        { employeeCode: "EMP004", totalCommission: 2000.0 },
      ];

      const topPerformers = commissionService.getTopPerformers(commissions, 2);

      expect(topPerformers).toHaveLength(2);
      expect(topPerformers[0]?.employeeCode).toBe("EMP003");
      expect(topPerformers[1]?.employeeCode).toBe("EMP001");
    });

    it("should calculate average commission", () => {
      const commissions = [
        { employeeCode: "EMP001", totalCommission: 1000.0 },
        { employeeCode: "EMP002", totalCommission: 2000.0 },
        { employeeCode: "EMP003", totalCommission: 3000.0 },
      ];

      const average =
        commissions.reduce((sum, c) => sum + c.totalCommission, 0) /
        commissions.length;

      expect(average).toBe(2000.0);
    });

    it("should calculate total commissions paid", () => {
      const commissions = [
        { employeeCode: "EMP001", totalCommission: 1000.0 },
        { employeeCode: "EMP002", totalCommission: 2000.0 },
        { employeeCode: "EMP003", totalCommission: 3000.0 },
      ];

      const total = commissions.reduce((sum, c) => sum + c.totalCommission, 0);

      expect(total).toBe(6000.0);
    });
  });

  describe("Commission Validation", () => {
    it("should reject negative commission rates", () => {
      const rate = -2.5;
      const isValid = commissionService.validateRate(rate);

      expect(isValid).toBe(false);
    });

    it("should accept zero commission rate", () => {
      const rate = 0;
      const isValid = commissionService.validateRate(rate);

      expect(isValid).toBe(true);
    });

    it("should accept reasonable commission rates", () => {
      const rates = [0.5, 1.0, 2.5, 5.0, 10.0];

      rates.forEach(rate => {
        expect(commissionService.validateRate(rate)).toBe(true);
      });
    });

    it("should reject unreasonably high rates", () => {
      const rate = 100.0; // 100% commission
      const isValid = commissionService.validateRate(rate);

      expect(isValid).toBe(false);
    });
  });

  describe("Period Calculations", () => {
    it("should calculate daily commissions", () => {
      const startDate = new Date("2026-04-01");
      const endDate = new Date("2026-04-01");

      const days = commissionService.getDateRange(startDate, endDate);

      expect(days).toBe(1);
    });

    it("should calculate monthly commissions", () => {
      const startDate = new Date("2026-04-01");
      const endDate = new Date("2026-04-30");

      const days = commissionService.getDateRange(startDate, endDate);

      expect(days).toBe(30);
    });

    it("should handle date validation", () => {
      const startDate = new Date("2026-04-30");
      const endDate = new Date("2026-04-01");

      const isValid = commissionService.validateDateRange(startDate, endDate);

      expect(isValid).toBe(false);
    });

    it("should accept valid date ranges", () => {
      const startDate = new Date("2026-04-01");
      const endDate = new Date("2026-04-30");

      const isValid = commissionService.validateDateRange(startDate, endDate);

      expect(isValid).toBe(true);
    });
  });
});
