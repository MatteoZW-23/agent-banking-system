import { getDb } from "../db";
import { transactions, dailySettlements, alertHistory, alertConfigurations, providers } from "../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface ReconciliationReport {
  date: string;
  providerId: number;
  providerName: string;
  totalExpected: number;
  totalActual: number;
  discrepancy: number;
  discrepancyPercentage: number;
  matchedCount: number;
  mismatchCount: number;
  unmatchedCount: number;
  missingExternal: Array<{ reference: string; amount: number }>;
  missingInternal: Array<{ reference: string; amount: number }>;
  mismatches: Array<{
    reference: string;
    expected: number;
    actual: number;
    difference: number;
  }>;
  status: "matched" | "mismatch" | "investigating";
  reconciliationTime: string;
}

export class ReconciliationEngine {
  /**
   * Run reconciliation for a specific provider on a specific date
   */
  async reconcileProvider(providerId: number, date: Date): Promise<ReconciliationReport> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get provider details
    const providerData = await db
      .select()
      .from(providers)
      .where(eq(providers.id, providerId))
      .limit(1);

    if (providerData.length === 0) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const provider = providerData[0];

    // Get internal transactions for the day
    const internalTxns = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.providerId, providerId),
          gte(transactions.transactionTime, startOfDay),
          lte(transactions.transactionTime, endOfDay),
          eq(transactions.status, "completed")
        )
      );

    // Calculate expected totals from internal ledger
    const totalExpected = internalTxns.reduce((sum, txn) => {
      const amount = typeof txn.amount === "string" ? parseFloat(txn.amount) : (txn.amount as number);
      return sum + amount;
    }, 0);

    // Get settlement record to compare against
    const settlement = await db
      .select()
      .from(dailySettlements)
      .where(
        and(
          eq(dailySettlements.providerId, providerId),
          eq(dailySettlements.settlementDate, date)
        )
      )
      .limit(1);

    const totalActual = settlement.length > 0 && settlement[0].actualTotal
      ? typeof settlement[0].actualTotal === "string"
        ? parseFloat(settlement[0].actualTotal)
        : (settlement[0].actualTotal as number)
      : 0;

    const discrepancy = totalActual - totalExpected;
    const discrepancyPercentage = totalExpected > 0 ? (discrepancy / totalExpected) * 100 : 0;
    const status = Math.abs(discrepancy) < 0.01 ? "matched" : Math.abs(discrepancyPercentage) > 5 ? "investigating" : "mismatch";

    // Perform transaction matching
    const matchedCount = internalTxns.filter((txn) => txn.reconciliationStatus === "matched").length;
    const mismatchCount = internalTxns.filter((txn) => txn.reconciliationStatus === "mismatch").length;
    const unmatchedCount = internalTxns.filter((txn) => txn.reconciliationStatus === "unreconciled").length;

    // Build mismatches array
    const mismatches: Array<{
      reference: string;
      expected: number;
      actual: number;
      difference: number;
    }> = [];

    for (const txn of internalTxns) {
      if (txn.reconciliationStatus === "mismatch" && txn.providerReference) {
        const amount = typeof txn.amount === "string" ? parseFloat(txn.amount) : (txn.amount as number);
        mismatches.push({
          reference: txn.providerReference,
          expected: amount,
          actual: 0, // Would be populated from external data
          difference: amount,
        });
      }
    }

    const report: ReconciliationReport = {
      date: date.toISOString().split("T")[0],
      providerId,
      providerName: provider.name,
      totalExpected,
      totalActual,
      discrepancy,
      discrepancyPercentage,
      matchedCount,
      mismatchCount,
      unmatchedCount,
      missingExternal: [],
      missingInternal: [],
      mismatches,
      status: status as "matched" | "mismatch" | "investigating",
      reconciliationTime: new Date().toISOString(),
    };

    // Trigger alerts if discrepancy is significant
    if (Math.abs(discrepancy) > 10) {
      await this.triggerAlert(
        providerId,
        "discrepancy",
        `Large discrepancy detected: ${discrepancy.toFixed(2)} (${discrepancyPercentage.toFixed(2)}%)`,
        "high"
      );
    }

    // Update settlement record
    if (settlement.length > 0) {
      await db
        .update(dailySettlements)
        .set({
          status: status as any,
          discrepancy: discrepancy.toString(),
          notes: `Matched: ${matchedCount}, Mismatched: ${mismatchCount}`,
          settledAt: new Date(),
        })
        .where(eq(dailySettlements.id, settlement[0].id));
    }

    return report;
  }

  /**
   * Match transactions between internal ledger and provider data
   */
  async matchTransactions(
    providerId: number,
    internalTxns: any[],
    externalTxns: any[]
  ): Promise<{
    matched: number;
    mismatched: number;
    unmatched: any[];
  }> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    let matched = 0;
    let mismatched = 0;
    const unmatched: any[] = [];

    for (const internalTxn of internalTxns) {
      const externalMatch = externalTxns.find(
        (ext) => ext.reference === internalTxn.providerReference
      );

      if (!externalMatch) {
        unmatched.push(internalTxn);
        continue;
      }

      const internalAmount = typeof internalTxn.amount === "string"
        ? parseFloat(internalTxn.amount)
        : (internalTxn.amount as number);
      const externalAmount = typeof externalMatch.amount === "string"
        ? parseFloat(externalMatch.amount)
        : (externalMatch.amount as number);

      if (Math.abs(internalAmount - externalAmount) < 0.01) {
        matched++;
        // Update reconciliation status
        await db
          .update(transactions)
          .set({ reconciliationStatus: "matched" })
          .where(eq(transactions.id, internalTxn.id));
      } else {
        mismatched++;
        // Update reconciliation status
        await db
          .update(transactions)
          .set({ reconciliationStatus: "mismatch" })
          .where(eq(transactions.id, internalTxn.id));
      }
    }

    return { matched, mismatched, unmatched };
  }

  /**
   * Trigger an alert for critical issues
   */
  private async triggerAlert(
    providerId: number,
    alertType: string,
    message: string,
    severity: "low" | "medium" | "high" | "critical"
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      // Find alert configuration
      const config = await db
        .select()
        .from(alertConfigurations)
        .where(
          and(
            eq(alertConfigurations.alertType, alertType as any),
            eq(alertConfigurations.isActive, true)
          )
        )
        .limit(1);

      if (config.length === 0) return;

      // Create alert history record
      await db.insert(alertHistory).values({
        alertConfigId: config[0].id,
        providerId,
        title: `${alertType.replace(/_/g, " ").toUpperCase()} Alert`,
        message,
        severity: severity as any,
        status: "triggered",
        triggeredAt: new Date(),
      });
    } catch (error) {
      console.error("[Reconciliation] Failed to trigger alert:", error);
    }
  }

  /**
   * Run full reconciliation across all providers
   */
  async reconcileAll(date: Date): Promise<ReconciliationReport[]> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get all active providers
    const allProviders = await db
      .select()
      .from(providers)
      .where(eq(providers.isActive, true));

    const reports: ReconciliationReport[] = [];

    for (const provider of allProviders) {
      try {
        const report = await this.reconcileProvider(provider.id, date);
        reports.push(report);
      } catch (error) {
        console.error(`[Reconciliation] Failed to reconcile provider ${provider.id}:`, error);
      }
    }

    return reports;
  }

  /**
   * Get reconciliation status for a provider
   */
  async getReconciliationStatus(providerId: number, days = 30): Promise<any[]> {
    const db = await getDb();
    if (!db) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await db
      .select()
      .from(dailySettlements)
      .where(
        and(
          eq(dailySettlements.providerId, providerId),
          gte(dailySettlements.settlementDate, startDate)
        )
      )
      .orderBy(desc(dailySettlements.settlementDate));
  }
}

export const reconciliationEngine = new ReconciliationEngine();
