import { getDb } from "../db";
import {
  transactions,
  dailySettlements,
  alertHistory,
  alertConfigurations,
  providers,
  commissionLedger,
  employees,
} from "../../drizzle/schema";
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
   * Pure analytical function to calculate reconciliation summary between two sets of transactions.
   * This is used by both unit tests and the production reconciliation flow.
   */
  calculateReconciliationSummary(
    internalTxns: any[],
    externalTotalFromProvider: number
  ) {
    const internalTotal = internalTxns.reduce((sum, txn) => {
      const amt = typeof txn.amount === "string" ? parseFloat(txn.amount) : (txn.amount as number);
      return sum + (amt || 0);
    }, 0);

    // Convert to Integer Cents for Zero Cent Loss precision
    const internalCents = Math.round(internalTotal * 100);
    const externalCents = Math.round(externalTotalFromProvider * 100);

    const discrepancyGrossCents = externalCents - internalCents;
    const discrepancyPercentage = internalTotal > 0 ? (discrepancyGrossCents / internalCents) * 100 : 0;
    
    // 85/15 Split Verification (Employee Protective Model)
    // We reserve the CEILING of 15% to ensure the employee never loses a fraction.
    const expectedCommissionCents = Math.ceil(internalCents * 0.15);
    const expectedSettlementCents = internalCents - expectedCommissionCents;
    
    const isNetMatched = externalCents === expectedSettlementCents;
    const isGrossMatched = internalCents === externalCents;

    const matchedCount = internalTxns.filter(t => t.reconciliationStatus === "matched").length;
    const mismatchCount = internalTxns.filter(t => t.reconciliationStatus === "mismatch").length;
    const unmatchedCount = internalTxns.filter(t => t.reconciliationStatus === "unreconciled").length;

    // A day is "matched" if it hits the 100% gross OR the 85% net settlement target.
    const status = (isGrossMatched || isNetMatched) 
      ? "matched" 
      : Math.abs(discrepancyPercentage) > 5 ? "investigating" : "mismatch";

    return {
      internalTotal,
      externalTotal: externalTotalFromProvider,
      discrepancy: isNetMatched ? 0 : (discrepancyGrossCents / 100),
      discrepancyPercentage: isNetMatched ? 0 : discrepancyPercentage,
      matchedCount,
      mismatchCount,
      unmatchedCount,
      status,
      isNetMatched,
      isGrossMatched
    };
  }

  /**
   * Run reconciliation for a specific provider on a specific date.
   * Orchestrates DB fetching and triggers analytical summary.
   */
  async reconcileProvider(
    providerId: number,
    date: Date
  ): Promise<ReconciliationReport> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const providerData = await db.select().from(providers).where(eq(providers.id, providerId)).limit(1);
    if (providerData.length === 0) throw new Error(`Provider ${providerId} not found`);
    const provider = providerData[0];

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

    const settlement = await db
      .select()
      .from(dailySettlements)
      .where(
        and(
          eq(dailySettlements.providerId, providerId),
          eq(dailySettlements.settlementDate, date.toISOString().split("T")[0])
        )
      )
      .limit(1);

    const externalTotal =
      settlement.length > 0 && settlement[0].actualTotal
        ? typeof settlement[0].actualTotal === "string"
          ? parseFloat(settlement[0].actualTotal)
          : (settlement[0].actualTotal as number)
        : 0;

    const summary = this.calculateReconciliationSummary(internalTxns, externalTotal);

    const reconNotes = summary.isNetMatched 
      ? `Verified 85% Net Settlement. 15% ($${(summary.internalTotal * 0.15).toFixed(2)}) reserved for Agent Salaries.`
      : summary.isGrossMatched 
        ? "Gross 100% Settlement Matched." 
        : `Discrepancy: $${summary.discrepancy.toFixed(2)}`;

    const report: ReconciliationReport = {
      date: date.toISOString().split("T")[0],
      providerId,
      providerName: provider.name,
      totalExpected: summary.internalTotal,
      totalActual: externalTotal,
      discrepancy: summary.discrepancy,
      discrepancyPercentage: summary.discrepancyPercentage,
      matchedCount: summary.matchedCount,
      mismatchCount: summary.mismatchCount,
      unmatchedCount: summary.unmatchedCount,
      missingExternal: [],
      missingInternal: [],
      mismatches: [],
      status: summary.status as any,
      reconciliationTime: new Date().toISOString(),
    };

    if (Math.abs(summary.discrepancy) > 10) {
      await this.triggerAlert(
        providerId,
        "discrepancy",
        `Significant discrepancy: $${summary.discrepancy.toFixed(2)} (${summary.discrepancyPercentage.toFixed(2)}%)`,
        "high"
      );
    }

    if (settlement.length > 0) {
      await db
        .update(dailySettlements)
        .set({
          status: summary.status as any,
          discrepancy: summary.discrepancy.toString(),
          notes: `${reconNotes} | Stats: M:${summary.matchedCount} MM:${summary.mismatchCount} UM:${summary.unmatchedCount}`,
          settledAt: new Date(),
        })
        .where(eq(dailySettlements.id, settlement[0].id));
    }

    return report;
  }

  /**
   * Match transactions with 85/15 Salary Split awareness.
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
      const externalMatch = externalTxns.find(ext => ext.reference === internalTxn.providerReference);

      if (!externalMatch) {
        unmatched.push(internalTxn);
        continue;
      }

      // Convert to Integer Cents for "Zero Cent Loss" precision
      const internalAmount = typeof internalTxn.amount === "string" ? parseFloat(internalTxn.amount) : (internalTxn.amount as number);
      const externalAmount = typeof externalMatch.amount === "string" ? parseFloat(externalMatch.amount) : (externalMatch.amount as number);
      
      const internalCents = Math.round(internalAmount * 100);
      const externalCents = Math.round(externalAmount * 100);

      const isExactMatch = internalCents === externalCents;
      
      // Calculate 15% split with Ceiling Bias for the Employee (0.1575 becomes 0.16)
      // This ensures the agent never loses a fraction of a cent.
      const expectedCommissionCents = Math.ceil(internalCents * 0.15);
      const expectedSettlementCents = internalCents - expectedCommissionCents;
      
      const isSettlementMatch = expectedSettlementCents === externalCents;

      if (isExactMatch || isSettlementMatch) {
        matched++;
        await db.update(transactions).set({ 
          reconciliationStatus: "matched",
          metadata: { 
            ...((internalTxn.metadata as any) || {}),
            reconType: isExactMatch ? "exact" : "salary_split_validated",
            settlementDelta: isSettlementMatch ? expectedCommissionCents / 100 : 0,
            precision: "zero_cent_loss_verified"
          }
        }).where(eq(transactions.id, internalTxn.id));

        await db.update(commissionLedger).set({ 
          status: "cleared",
          amount: isSettlementMatch ? (expectedCommissionCents / 100).toString() : undefined, // Pulse correction
          clearedAt: new Date(),
          notes: `Cleared via Zero-Cent-Loss Recon. Split: ${isSettlementMatch ? '85/15 Net' : '100% Gross'}`
        } as any).where(and(eq(commissionLedger.transactionId, internalTxn.id), eq(commissionLedger.status, "pending")));
      } else {
        mismatched++;
        const shortageCents = expectedSettlementCents - externalCents;
        const isShortage = shortageCents > 0;

        await db.update(transactions).set({ 
          reconciliationStatus: "mismatch",
          metadata: {
            ...((internalTxn.metadata as any) || {}),
            reconFailureReason: isShortage ? "shortage_detected" : "amount_mismatch",
            expectedInternal: internalAmount,
            receivedExternal: externalAmount,
            shortageAmount: isShortage ? shortageCents / 100 : 0
          }
        }).where(eq(transactions.id, internalTxn.id));

        // Create shortage penalty for the employee if it's a confirmed loss
        if (isShortage && internalTxn.employeeCode) {
          // Find employee ID by code
          const employeeData = await db.select({ id: employees.id }).from(employees).where(eq(employees.uniqueCode, internalTxn.employeeCode)).limit(1);
          
          if (employeeData.length > 0) {
            await db.insert(commissionLedger).values({
              employeeId: employeeData[0].id,
              providerId,
              transactionId: internalTxn.id,
              amount: (shortageCents / 100).toString(),
              type: "shortage_penalty",
              status: "cleared",
              earnedAt: new Date(),
              payoutReference: `SHORTAGE_AUTO_${internalTxn.id}`
            } as any);
          }
        }
      }
    }
    return { matched, mismatched, unmatched };
  }

  getDiscrepancySeverity(mismatch: {
    discrepancy: number;
    discrepancyPercentage: number;
  }): "low" | "medium" | "high" | "critical" {
    const absDiff = Math.abs(mismatch.discrepancy);
    if (absDiff > 100) return "critical";
    if (absDiff > 50) return "high";
    if (absDiff > 10) return "medium";
    return "low";
  }

  private async triggerAlert(
    providerId: number,
    alertType: string,
    message: string,
    severity: "low" | "medium" | "high" | "critical"
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;
    try {
      const config = await db.select().from(alertConfigurations).where(and(eq(alertConfigurations.alertType, alertType as any), eq(alertConfigurations.isActive, true))).limit(1);
      if (config.length === 0) return;
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
      console.error("[Reconciliation] Alert failed:", error);
    }
  }

  async reconcileAll(date: Date): Promise<ReconciliationReport[]> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const allProviders = await db.select().from(providers).where(eq(providers.isActive, true));
    const reports: ReconciliationReport[] = [];
    for (const provider of allProviders) {
      try {
        const report = await this.reconcileProvider(provider.id, date);
        reports.push(report);
      } catch (error) {
        console.error(`[Reconciliation] Provider ${provider.id} failed:`, error);
      }
    }
    return reports;
  }

  async getReconciliationStatus(providerId: number, days = 30): Promise<any[]> {
    const db = await getDb();
    if (!db) return [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return await db.select().from(dailySettlements).where(and(eq(dailySettlements.providerId, providerId), gte(dailySettlements.settlementDate, startDate.toISOString().split("T")[0]))).orderBy(desc(dailySettlements.settlementDate));
  }
}

export const reconciliationEngine = new ReconciliationEngine();
