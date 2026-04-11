import { getDb } from "../db";
import {
  transactions,
  alertHistory,
  alertConfigurations,
  transactionFlags,
  employees,
} from "../../drizzle/schema";
import { eq, and, gte, sql, desc, count } from "drizzle-orm";

export class GuardianService {
  /**
   * Real-time risk analysis for a new transaction
   */
  async performActiveGuard(transactionId: number) {
    const db = await getDb();
    if (!db) return;

    // 1. Fetch transaction details
    const [txn] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);

    if (!txn) return;

    let riskScore = 0;
    const flags: string[] = [];

    // --- HEURISTIC 1: Velocity Smurfing (Customer focus) ---
    if (txn.customerPhone) {
      const windowStart = new Date(Date.now() - 3600000); // 1 hour window
      const recentCustomerTxns = await db
        .select({ count: count() })
        .from(transactions)
        .where(
          and(
            eq(transactions.customerPhone, txn.customerPhone),
            gte(transactions.transactionTime, windowStart)
          )
        );
      
      const txCount = recentCustomerTxns[0]?.count || 0;
      if (txCount > 3) {
        riskScore += 0.3;
        flags.push("HEURISTIC_VELOCITY_SMURFING_RISK");
      }
    }

    // --- HEURISTIC 2: High-Value Depletion (Liquidity focus) ---
    const amt = parseFloat(txn.amount || "0");
    if (amt > 1500) {
      riskScore += 0.4;
      flags.push("HEURISTIC_HIGH_VALUE_DEPLETION");
    }

    // --- HEURISTIC 3: Unusual Hours (Operational focus) ---
    const hour = txn.transactionTime.getHours();
    if (hour < 6 || hour > 20) { // Outside 6am - 8pm
      riskScore += 0.2;
      flags.push("HEURISTIC_OFF_HOURS_ACTIVITY");
    }

    // 2. Persist Risk Flags if significant
    if (riskScore > 0.4) {
      await db.insert(transactionFlags).values({
        transactionId: txn.id,
        flagType: riskScore > 0.7 ? "fraud_risk" : "suspicious_pattern",
        riskScore: riskScore.toString(),
        reason: flags.join(", "),
        status: "flagged",
        createdAt: new Date()
      });

      // 3. Trigger Administrative Alert
      await db.insert(alertHistory).values({
        alertConfigId: 1, // Base Discrepancy/Risk Config
        providerId: txn.providerId,
        transactionId: txn.id,
        title: `CRITICAL RISK: ${txn.type.toUpperCase()} on Provider ${txn.providerId}`,
        message: `Security Engine detected high-risk activity (${(riskScore * 100).toFixed(0)}%). Flags: ${flags.join(", ")}`,
        severity: riskScore > 0.7 ? "critical" : "high",
        status: "triggered",
        triggeredAt: new Date()
      });

      // 4. Protection: If severe, freeze the reconciliation state
      if (riskScore > 0.8) {
        await db.update(transactions).set({ 
          reconciliationStatus: "investigating",
          failureReason: "GUARD_AUTO_FREEZE_HIGH_RISK"
        }).where(eq(transactions.id, txn.id));
      }
    }

    return { riskScore, flags };
  }

  /**
   * Predictive Float Rebalancing Suggestions
   */
  async getLiquidityForecast(employeeId: number) {
    const db = await getDb();
    if (!db) return;

    // Analyze last 24h burn rate
    const yesterday = new Date(Date.now() - 86400000);
    
    // Import liquidity orchestrator for current position
    const { liquidityOrchestrator } = await import("./liquidity");
    const position = await liquidityOrchestrator.getAgentPosition(employeeId);

    const recentOutflows = await db
      .select({ 
        providerId: transactions.providerId, 
        total: sql<number>`sum(amount)` 
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.employeeCode, await this.getEmployeeCode(employeeId)),
          eq(transactions.type, "cash_in"), // Agent sends float, collects cash
          gte(transactions.transactionTime, yesterday)
        )
      )
      .groupBy(transactions.providerId);

    const suggestions = recentOutflows.map(out => {
      const burnRatePerHour = out.total / 24;
      const currentFloat = position.floatBalances[out.providerId] || 0;
      const hoursRemaining = burnRatePerHour > 0 ? currentFloat / burnRatePerHour : 100;

      return {
        providerId: out.providerId,
        burnRatePerHour: burnRatePerHour.toFixed(2),
        currentFloat: currentFloat.toFixed(2),
        hoursRemaining: hoursRemaining.toFixed(1),
        recommendation: hoursRemaining < 4 ? "CRITICAL_TOPUP" : hoursRemaining < 12 ? "PREVENTIVE_TOPUP" : "STABLE"
      };
    });

    return suggestions;
  }

  private async getEmployeeCode(id: number): Promise<string> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const emp = await db.select({ code: employees.uniqueCode }).from(employees).where(eq(employees.id, id)).limit(1);
    return emp[0]?.code || "UNKNOWN";
  }
}

export const guardianService = new GuardianService();
