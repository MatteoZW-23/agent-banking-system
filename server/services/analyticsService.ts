import { getDb } from "../db";
import { transactions, providers, employees, dailySettlements, providerFloats } from "../../drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export interface TransactionTrend {
  date: string;
  totalAmount: number;
  transactionCount: number;
  successCount: number;
  failureCount: number;
  avgTransactionSize: number;
}

export interface ProviderMetrics {
  providerId: number;
  providerName: string;
  totalTransactions: number;
  totalVolume: number;
  successRate: number;
  avgTransactionSize: number;
  floatBalance: number;
  lastReconciliation: Date | null;
  reconciliationStatus: string;
}

export interface EmployeePerformance {
  employeeId: number;
  employeeName: string;
  uniqueCode: string;
  totalTransactions: number;
  totalVolume: number;
  totalCommission: number;
  avgTransactionSize: number;
  successRate: number;
  topProvider: string;
}

export interface DailyFinancialSummary {
  date: string;
  totalTransactionVolume: number;
  totalTransactionCount: number;
  totalCommissions: number;
  totalFloatBalance: number;
  activeProviders: number;
  reconciliationStatus: {
    successful: number;
    failed: number;
    pending: number;
  };
}

export interface ProviderComparison {
  metric: string;
  providers: {
    name: string;
    value: number;
  }[];
}

/**
 * Analytics Service
 * Provides aggregated data for dashboard visualizations
 */
export class AnalyticsService {
  /**
   * Get transaction trends for a date range
   */
  async getTransactionTrends(days: number = 30): Promise<TransactionTrend[]> {
    try {
      const db = await getDb();
      if (!db) return [];

      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const results = await db
        .select({
          date: sql<string>`DATE(${transactions.transactionTime})`,
          totalAmount: sql<number>`SUM(${transactions.amount})`,
          transactionCount: sql<number>`COUNT(*)`,
          successCount: sql<number>`SUM(CASE WHEN ${transactions.status} = 'completed' THEN 1 ELSE 0 END)`,
          failureCount: sql<number>`SUM(CASE WHEN ${transactions.status} = 'failed' THEN 1 ELSE 0 END)`,
          avgTransactionSize: sql<number>`AVG(${transactions.amount})`,
        })
        .from(transactions)
        .where(gte(transactions.transactionTime, cutoffDate))
        .groupBy(sql`DATE(${transactions.transactionTime})`)  
        .orderBy(sql`DATE(${transactions.transactionTime})`)

      return results.map((r: any) => ({
        date: r.date || new Date().toISOString().split("T")[0],
        totalAmount: parseFloat(r.totalAmount || "0"),
        transactionCount: r.transactionCount || 0,
        successCount: r.successCount || 0,
        failureCount: r.failureCount || 0,
        avgTransactionSize: parseFloat(r.avgTransactionSize || "0"),
      }));
    } catch (error) {
      console.error("[Analytics] Failed to get transaction trends:", error);
      return [];
    }
  }

  /**
   * Get provider performance metrics
   */
  async getProviderMetrics(): Promise<ProviderMetrics[]> {
    try {
      const db = await getDb();
      if (!db) return [];

      const providerList = await db.select().from(providers);

      const metrics: ProviderMetrics[] = [];

      for (const provider of providerList) {
        const txResults = await db
          .select({
            totalTransactions: sql<number>`COUNT(*)`,
            totalVolume: sql<number>`SUM(${transactions.amount})`,
            successCount: sql<number>`SUM(CASE WHEN ${transactions.status} = 'completed' THEN 1 ELSE 0 END)`,
            avgTransactionSize: sql<number>`AVG(${transactions.amount})`,
          })
          .from(transactions)
          .where(eq(transactions.providerId, provider.id));

        const txData = txResults[0] || {};
        const totalTx = txData.totalTransactions || 0;
        const successTx = txData.successCount || 0;

        // Get latest float balance
        const floatResults = await db
          .select({
            currentBalance: providerFloats.currentBalance,
            lastReconciledAt: providerFloats.lastReconciledAt,
          })
          .from(providerFloats)
          .where(eq(providerFloats.providerId, provider.id))
          .orderBy(sql`${providerFloats.updatedAt} DESC`)
          .limit(1);

        const latestFloat = floatResults[0];

        metrics.push({
          providerId: provider.id,
          providerName: provider.name,
          totalTransactions: totalTx,
          totalVolume: parseFloat(String(txData.totalVolume || "0")),
          successRate: totalTx > 0 ? (successTx / totalTx) * 100 : 0,
          avgTransactionSize: parseFloat(String(txData.avgTransactionSize || "0")),
          floatBalance: latestFloat ? parseFloat(String(latestFloat.currentBalance || "0")) : 0,
          lastReconciliation: latestFloat?.lastReconciledAt || null,
          reconciliationStatus: latestFloat ? "reconciled" : "pending",
        });
      }

      return metrics.sort((a, b) => b.totalVolume - a.totalVolume);
    } catch (error) {
      console.error("[Analytics] Failed to get provider metrics:", error);
      return [];
    }
  }

  /**
   * Get employee performance metrics
   */
  async getEmployeePerformance(): Promise<EmployeePerformance[]> {
    try {
      const db = await getDb();
      if (!db) return [];

      const employeeList = await db.select().from(employees);
      const performance: EmployeePerformance[] = [];

      for (const employee of employeeList) {
        const txResults = await db
          .select({
            totalTransactions: sql<number>`COUNT(*)`,
            totalVolume: sql<number>`SUM(${transactions.amount})`,
            successCount: sql<number>`SUM(CASE WHEN ${transactions.status} = 'completed' THEN 1 ELSE 0 END)`,
            avgTransactionSize: sql<number>`AVG(${transactions.amount})`,
          })
          .from(transactions)
          .where(eq(transactions.employeeCode, employee.uniqueCode));

        const txData = txResults[0] || {};
        const totalTx = txData.totalTransactions || 0;
        const successTx = txData.successCount || 0;

        // Get top provider
        const topProviderResult = await db
          .select({
            providerName: providers.name,
            count: sql<number>`COUNT(*)`,
          })
          .from(transactions)
          .leftJoin(providers, eq(transactions.providerId, providers.id))
          .where(eq(transactions.employeeCode, employee.uniqueCode))
          .groupBy(transactions.providerId)
          .orderBy(sql`COUNT(*) DESC`)
          .limit(1);

        performance.push({
          employeeId: employee.id,
          employeeName: employee.name,
          uniqueCode: employee.uniqueCode,
          totalTransactions: totalTx,
          totalVolume: parseFloat(String(txData.totalVolume || "0")),
          totalCommission: 0, // Will be calculated by commission service
          avgTransactionSize: parseFloat(String(txData.avgTransactionSize || "0")),
          successRate: totalTx > 0 ? (successTx / totalTx) * 100 : 0,
          topProvider: topProviderResult[0]?.providerName || "N/A",
        });
      }

      return performance.sort((a, b) => b.totalVolume - a.totalVolume);
    } catch (error) {
      console.error("[Analytics] Failed to get employee performance:", error);
      return [];
    }
  }

  /**
   * Get daily financial summary
   */
  async getDailyFinancialSummary(date?: Date): Promise<DailyFinancialSummary> {
    try {
      const db = await getDb();
      if (!db) {
        return this.getEmptySummary();
      }

      const targetDate = date || new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Transaction metrics
      const txResults = await db
        .select({
          totalVolume: sql<number>`SUM(${transactions.amount})`,
          totalCount: sql<number>`COUNT(*)`,
        })
        .from(transactions)
        .where(
          and(
            gte(transactions.transactionTime, startOfDay),
            lte(transactions.transactionTime, endOfDay)
          )
        );

      const txData = txResults[0] || {};

      // Float balance
      const floatResults = await db
        .select({
          totalFloat: sql<number>`SUM(${providerFloats.currentBalance})`,
          activeCount: sql<number>`COUNT(DISTINCT ${providerFloats.providerId})`,
        })
        .from(providerFloats);

      const floatData = floatResults[0] || {};

      // Reconciliation status
      const reconciliationResults = await db
        .select({
          status: dailySettlements.status,
          count: sql<number>`COUNT(*)`,
        })
        .from(dailySettlements)
        .where(
          and(
            gte(dailySettlements.settlementDate, startOfDay),
            lte(dailySettlements.settlementDate, endOfDay)
          )
        )
        .groupBy(dailySettlements.status);

      const reconciliationStatus = {
        successful: 0,
        failed: 0,
        pending: 0,
      };

      for (const rec of reconciliationResults) {
        if (rec.status === "completed") reconciliationStatus.successful += rec.count || 0;
        else if (rec.status === "failed") reconciliationStatus.failed += rec.count || 0;
        else reconciliationStatus.pending += rec.count || 0;
      }

      return {
        date: targetDate.toISOString().split("T")[0],
        totalTransactionVolume: parseFloat(String(txData.totalVolume || "0")),
        totalTransactionCount: txData.totalCount || 0,
        totalCommissions: 0, // Will be calculated by commission service
        totalFloatBalance: parseFloat(String(floatData.totalFloat || "0")),
        activeProviders: floatData.activeCount || 0,
        reconciliationStatus,
      };
    } catch (error) {
      console.error("[Analytics] Failed to get daily summary:", error);
      return this.getEmptySummary();
    }
  }

  /**
   * Get provider comparison data
   */
  async getProviderComparison(): Promise<ProviderComparison[]> {
    try {
      const metrics = await this.getProviderMetrics();

      return [
        {
          metric: "Transaction Volume",
          providers: metrics.map((m) => ({
            name: m.providerName,
            value: m.totalVolume,
          })),
        },
        {
          metric: "Transaction Count",
          providers: metrics.map((m) => ({
            name: m.providerName,
            value: m.totalTransactions,
          })),
        },
        {
          metric: "Success Rate (%)",
          providers: metrics.map((m) => ({
            name: m.providerName,
            value: Math.round(m.successRate),
          })),
        },
        {
          metric: "Float Balance",
          providers: metrics.map((m) => ({
            name: m.providerName,
            value: m.floatBalance,
          })),
        },
      ];
    } catch (error) {
      console.error("[Analytics] Failed to get provider comparison:", error);
      return [];
    }
  }

  /**
   * Get transaction volume by provider
   */
  async getTransactionVolumeByProvider(): Promise<
    { name: string; value: number; percentage: number }[]
  > {
    try {
      const metrics = await this.getProviderMetrics();
      const totalVolume = metrics.reduce((sum, m) => sum + m.totalVolume, 0);

      return metrics.map((m) => ({
        name: m.providerName,
        value: m.totalVolume,
        percentage: totalVolume > 0 ? (m.totalVolume / totalVolume) * 100 : 0,
      }));
    } catch (error) {
      console.error("[Analytics] Failed to get transaction volume by provider:", error);
      return [];
    }
  }

  /**
   * Get transaction status distribution
   */
  async getTransactionStatusDistribution(days: number = 30): Promise<
    { status: string; count: number; percentage: number }[]
  > {
    try {
      const db = await getDb();
      if (!db) return [];

      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const results = await db
        .select({
          status: transactions.status,
          count: sql<number>`COUNT(*)`,
        })
        .from(transactions)
        .where(gte(transactions.transactionTime, cutoffDate))
        .groupBy(transactions.status);

      const total = results.reduce((sum, r) => sum + (r.count || 0), 0);

      return results.map((r: any) => ({
        status: String(r.status || "unknown"),
        count: r.count || 0,
        percentage: total > 0 ? ((r.count || 0) / total) * 100 : 0,
      }));
    } catch (error) {
      console.error("[Analytics] Failed to get transaction status distribution:", error);
      return [];
    }
  }

  /**
   * Get hourly transaction pattern
   */
  async getHourlyTransactionPattern(days: number = 7): Promise<
    { hour: number; count: number; volume: number }[]
  > {
    try {
      const db = await getDb();
      if (!db) return [];

      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const results = await db
        .select({
          hour: sql<number>`HOUR(${transactions.transactionTime})`,
          count: sql<number>`COUNT(*)`,
          volume: sql<number>`SUM(${transactions.amount})`,
        })
        .from(transactions)
        .where(gte(transactions.transactionTime, cutoffDate))
        .groupBy(sql`HOUR(${transactions.transactionTime})`)  
        .orderBy(sql`HOUR(${transactions.transactionTime})`)

      return results.map((r: any) => ({
        hour: Number(r.hour || 0),
        count: Number(r.count || 0),
        volume: parseFloat(String(r.volume || "0")),
      }));
    } catch (error) {
      console.error("[Analytics] Failed to get hourly pattern:", error);
      return [];
    }
  }

  /**
   * Helper: Get empty summary
   */
  private getEmptySummary(): DailyFinancialSummary {
    return {
      date: new Date().toISOString().split("T")[0],
      totalTransactionVolume: 0,
      totalTransactionCount: 0,
      totalCommissions: 0,
      totalFloatBalance: 0,
      activeProviders: 0,
      reconciliationStatus: {
        successful: 0,
        failed: 0,
        pending: 0,
      },
    };
  }
}

// Singleton instance
let analyticsService: AnalyticsService | null = null;

/**
 * Get or create analytics service instance
 */
export function getAnalyticsService(): AnalyticsService {
  if (!analyticsService) {
    analyticsService = new AnalyticsService();
  }
  return analyticsService;
}
