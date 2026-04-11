import { getDb } from "../db";
import {
  transactions,
  floatRequests,
  checkIns,
  employees,
  commissionLedger,
} from "../../drizzle/schema";
import { eq, and, gt, sql, desc } from "drizzle-orm";

export interface AgentPosition {
  employeeId: number;
  cashInHand: number;
  floatBalances: Record<number, number>; // providerId -> amount
  totalDebt: number;
  unsettledRequests: number;
}

export class LiquidityOrchestrator {
  /**
   * Calculate exact current position of an agent (Cash vs Float vs Debt)
   */
  async getAgentPosition(employeeId: number): Promise<AgentPosition> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 1. Get the latest check-in/opening balance
    const latestCheckIn = await db
      .select()
      .from(checkIns)
      .where(eq(checkIns.employeeId, employeeId))
      .orderBy(desc(checkIns.checkInTime))
      .limit(1);

    const startBalance = latestCheckIn[0];
    let cash = parseFloat(startBalance?.openingCash || "0");
    let floatBalances: Record<number, number> = (startBalance?.openingLineBalances as any) || {};

    // 2. Adjust for all transactions since check-in
    const startTime = startBalance?.checkInTime || new Date(0);
    const recentTxns = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.employeeCode, await this.getEmployeeCode(employeeId)),
          gt(transactions.transactionTime, startTime),
          eq(transactions.status, "completed")
        )
      );

    for (const txn of recentTxns) {
      const amt = parseFloat(txn.amount || "0");
      const providerId = txn.providerId;

      if (txn.type === "cash_in") {
        cash += amt; // Collect cash
        floatBalances[providerId] = (floatBalances[providerId] || 0) - amt; // Send float
      } else if (txn.type === "cash_out") {
        cash -= amt; // Give cash
        floatBalances[providerId] = (floatBalances[providerId] || 0) + amt; // Receive float
      } else if (txn.type === "salary_disbursement") {
        cash += amt; // Agent received their salary in cash, increasing their physical ledger
      } else if (txn.type === "float_purchase" && (txn.metadata as any)?.is_commission_refill) {
        floatBalances[providerId] = (floatBalances[providerId] || 0) + amt; // Agent refilled float using their commission
      }
    }

    // 3. Track Outstanding Debt from Float Requests
    const debtRecords = await db
      .select()
      .from(floatRequests)
      .where(
        and(
          eq(floatRequests.employeeId, employeeId),
          eq(floatRequests.status, "approved") // Approved means float was given, not yet 'completed' (repaid)
        )
      );

    const totalDebt = debtRecords.reduce((sum, req) => sum + parseFloat(req.amount || "0"), 0);

    return {
      employeeId,
      cashInHand: cash,
      floatBalances,
      totalDebt,
      unsettledRequests: debtRecords.length,
    };
  }

  /**
   * Automatic Settlement Engine: Converts excess cash to float repayment
   */
  async runAutoSettlement(employeeId: number, cashThreshold = 500) {
    const db = await getDb();
    if (!db) return;

    const position = await this.getAgentPosition(employeeId);

    // RULE: If cash is high AND agent has float debt -> Auto Repay
    if (position.cashInHand > cashThreshold && position.totalDebt > 0) {
      console.log(`[Liquidity] Auto-Settlement triggered for Agent ${employeeId}. Cash: ${position.cashInHand}, Debt: ${position.totalDebt}`);

      const debtToClear = Math.min(position.cashInHand - (cashThreshold / 2), position.totalDebt);
      
      if (debtToClear <= 0) return;

      // Identify requests to repay (FIFO - First In First Out)
      const pendingRequests = await db
        .select()
        .from(floatRequests)
        .where(and(eq(floatRequests.employeeId, employeeId), eq(floatRequests.status, "approved")))
        .orderBy(floatRequests.requestTime);

      let remainingToSettle = debtToClear;

      for (const req of pendingRequests) {
        if (remainingToSettle <= 0) break;

        const reqAmount = parseFloat(req.amount || "0");
        const settleAmt = Math.min(reqAmount, remainingToSettle);

        // Update Float Request Status
        await db
          .update(floatRequests)
          .set({
            status: settleAmt >= reqAmount ? "completed" : "approved", // Fully settled or partially
            adminNotes: (req.adminNotes || "") + ` | Auto-Settled $${settleAmt.toFixed(2)} on ${new Date().toISOString()}`,
          })
          .where(eq(floatRequests.id, req.id));

        // Log the outflow in transactions (Virtual Cash -> Float Reversal)
        await db.insert(transactions).values({
          providerId: req.providerId,
          employeeCode: await this.getEmployeeCode(employeeId),
          type: "float_redemption",
          amount: settleAmt.toString(),
          status: "completed",
          providerReference: `AUTO_SETTLE_${req.id}_${Date.now()}`,
          internalReference: `LIQ_REV_${req.id}_${Date.now()}`,
          transactionTime: new Date(),
          metadata: { 
            reason: "auto_cash_to_float_reversal",
            originalRequestId: req.id,
            fundingSource: req.providerId 
          }
        });

        remainingToSettle -= settleAmt;
      }

      return { settled: debtToClear, remainingDebt: position.totalDebt - debtToClear };
    }
  }

  private async getEmployeeCode(id: number): Promise<string> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const emp = await db.select({ code: employees.uniqueCode }).from(employees).where(eq(employees.id, id)).limit(1);
    return emp[0]?.code || "UNKNOWN";
  }
}

export const liquidityOrchestrator = new LiquidityOrchestrator();
