import { describe, it, expect, beforeEach, vi } from "vitest";
import { analyticsService } from "./analyticsService";

describe("Analytics Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTransactionTrends", () => {
    it("should return transaction trends for specified days", async () => {
      const trends = await analyticsService.getTransactionTrends(30);
      expect(trends).toBeDefined();
      expect(Array.isArray(trends)).toBe(true);
      if (trends.length > 0) {
        expect(trends[0]).toHaveProperty("date");
        expect(trends[0]).toHaveProperty("count");
        expect(trends[0]).toHaveProperty("volume");
      }
    });

    it("should handle different time ranges", async () => {
      const trends7 = await analyticsService.getTransactionTrends(7);
      const trends30 = await analyticsService.getTransactionTrends(30);
      const trends90 = await analyticsService.getTransactionTrends(90);
      
      expect(trends7).toBeDefined();
      expect(trends30).toBeDefined();
      expect(trends90).toBeDefined();
    });
  });

  describe("getProviderMetrics", () => {
    it("should return metrics for all providers", async () => {
      const metrics = await analyticsService.getProviderMetrics();
      expect(metrics).toBeDefined();
      expect(Array.isArray(metrics)).toBe(true);
      
      if (metrics.length > 0) {
        expect(metrics[0]).toHaveProperty("providerId");
        expect(metrics[0]).toHaveProperty("providerName");
        expect(metrics[0]).toHaveProperty("transactionCount");
        expect(metrics[0]).toHaveProperty("totalVolume");
        expect(metrics[0]).toHaveProperty("avgTransactionSize");
      }
    });

    it("should calculate correct averages", async () => {
      const metrics = await analyticsService.getProviderMetrics();
      
      metrics.forEach((metric) => {
        if (metric.transactionCount > 0) {
          const expectedAvg = metric.totalVolume / metric.transactionCount;
          expect(metric.avgTransactionSize).toBeCloseTo(expectedAvg, 2);
        }
      });
    });
  });

  describe("getEmployeePerformance", () => {
    it("should return employee performance data", async () => {
      const performance = await analyticsService.getEmployeePerformance();
      expect(performance).toBeDefined();
      expect(Array.isArray(performance)).toBe(true);
      
      if (performance.length > 0) {
        expect(performance[0]).toHaveProperty("employeeId");
        expect(performance[0]).toHaveProperty("employeeName");
        expect(performance[0]).toHaveProperty("uniqueCode");
        expect(performance[0]).toHaveProperty("transactionCount");
        expect(performance[0]).toHaveProperty("totalVolume");
      }
    });

    it("should rank employees by volume", async () => {
      const performance = await analyticsService.getEmployeePerformance();
      
      for (let i = 0; i < performance.length - 1; i++) {
        expect(performance[i].totalVolume).toBeGreaterThanOrEqual(
          performance[i + 1].totalVolume
        );
      }
    });
  });

  describe("getDailyFinancialSummary", () => {
    it("should return daily financial summary", async () => {
      const summary = await analyticsService.getDailyFinancialSummary();
      expect(summary).toBeDefined();
      
      expect(summary).toHaveProperty("totalTransactions");
      expect(summary).toHaveProperty("totalVolume");
      expect(summary).toHaveProperty("avgTransactionSize");
      expect(summary).toHaveProperty("totalFloatBalance");
      expect(summary).toHaveProperty("activeProviders");
      expect(summary).toHaveProperty("flaggedTransactions");
    });

    it("should have valid numeric values", async () => {
      const summary = await analyticsService.getDailyFinancialSummary();
      
      expect(typeof summary.totalTransactions).toBe("number");
      expect(typeof summary.totalVolume).toBe("number");
      expect(typeof summary.avgTransactionSize).toBe("number");
      expect(typeof summary.totalFloatBalance).toBe("number");
      expect(typeof summary.activeProviders).toBe("number");
      expect(typeof summary.flaggedTransactions).toBe("number");
    });
  });

  describe("getTransactionVolumeByProvider", () => {
    it("should return volume breakdown by provider", async () => {
      const volume = await analyticsService.getTransactionVolumeByProvider();
      expect(volume).toBeDefined();
      expect(Array.isArray(volume)).toBe(true);
      
      if (volume.length > 0) {
        expect(volume[0]).toHaveProperty("name");
        expect(volume[0]).toHaveProperty("value");
      }
    });

    it("should sum to total volume", async () => {
      const volume = await analyticsService.getTransactionVolumeByProvider();
      const summary = await analyticsService.getDailyFinancialSummary();
      
      const totalVolume = volume.reduce((sum, item) => sum + item.value, 0);
      expect(totalVolume).toBeCloseTo(summary.totalVolume, 0);
    });
  });

  describe("getTransactionStatusDistribution", () => {
    it("should return status distribution", async () => {
      const distribution = await analyticsService.getTransactionStatusDistribution(30);
      expect(distribution).toBeDefined();
      expect(Array.isArray(distribution)).toBe(true);
      
      if (distribution.length > 0) {
        expect(distribution[0]).toHaveProperty("name");
        expect(distribution[0]).toHaveProperty("value");
      }
    });

    it("should have valid status names", async () => {
      const distribution = await analyticsService.getTransactionStatusDistribution(30);
      const validStatuses = ["completed", "pending", "failed", "cancelled"];
      
      distribution.forEach((item) => {
        expect(validStatuses).toContain(item.name.toLowerCase());
      });
    });
  });

  describe("getHourlyTransactionPattern", () => {
    it("should return hourly transaction pattern", async () => {
      const pattern = await analyticsService.getHourlyTransactionPattern(7);
      expect(pattern).toBeDefined();
      expect(Array.isArray(pattern)).toBe(true);
      expect(pattern.length).toBeLessThanOrEqual(24);
      
      if (pattern.length > 0) {
        expect(pattern[0]).toHaveProperty("hour");
        expect(pattern[0]).toHaveProperty("count");
        expect(pattern[0]).toHaveProperty("volume");
      }
    });

    it("should have valid hour values", async () => {
      const pattern = await analyticsService.getHourlyTransactionPattern(7);
      
      pattern.forEach((item) => {
        expect(item.hour).toBeGreaterThanOrEqual(0);
        expect(item.hour).toBeLessThan(24);
      });
    });
  });

  describe("getCommissionAnalytics", () => {
    it("should return commission analytics", async () => {
      const analytics = await analyticsService.getCommissionAnalytics();
      expect(analytics).toBeDefined();
      
      expect(analytics).toHaveProperty("totalCommissions");
      expect(analytics).toHaveProperty("averageCommission");
      expect(analytics).toHaveProperty("topEarners");
      expect(analytics).toHaveProperty("commissionByType");
    });

    it("should have valid commission data", async () => {
      const analytics = await analyticsService.getCommissionAnalytics();
      
      expect(typeof analytics.totalCommissions).toBe("number");
      expect(typeof analytics.averageCommission).toBe("number");
      expect(Array.isArray(analytics.topEarners)).toBe(true);
      expect(Array.isArray(analytics.commissionByType)).toBe(true);
    });
  });

  describe("getReconciliationMetrics", () => {
    it("should return reconciliation metrics", async () => {
      const metrics = await analyticsService.getReconciliationMetrics();
      expect(metrics).toBeDefined();
      
      expect(metrics).toHaveProperty("totalReconciliations");
      expect(metrics).toHaveProperty("successRate");
      expect(metrics).toHaveProperty("totalDiscrepancies");
      expect(metrics).toHaveProperty("avgDiscrepancyAmount");
      expect(metrics).toHaveProperty("recentDiscrepancies");
    });

    it("should have valid reconciliation data", async () => {
      const metrics = await analyticsService.getReconciliationMetrics();
      
      expect(typeof metrics.totalReconciliations).toBe("number");
      expect(typeof metrics.successRate).toBe("number");
      expect(metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeLessThanOrEqual(100);
    });
  });
});
