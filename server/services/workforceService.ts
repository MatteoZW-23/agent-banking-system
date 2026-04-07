import { getDb } from "../db";
import {
  checkIns,
  transactions,
  employees,
  alertHistory,
  alertConfigurations,
  commissionLedger,
} from "../../drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export class WorkforceService {
  /**
   * Validate a worker's checkout and calculate discrepancies
   */
  async validateCheckout(checkInId: number): Promise<any> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 1. Get check-in record
    const checkInData = await db
      .select()
      .from(checkIns)
      .where(eq(checkIns.id, checkInId))
      .limit(1);

    if (checkInData.length === 0) throw new Error("Check-in session not found");
    const session = checkInData[0];
    if (!session.checkOutTime)
      return { status: "ongoing", message: "Worker has not checked out yet." };

    // 2. Get all transactions during this person's shift
    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.id, session.employeeId))
      .limit(1);
    const employeeCode = employee[0]?.uniqueCode;

    const shiftTxns = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.employeeCode, employeeCode),
          gte(transactions.transactionTime, session.checkInTime!),
          lte(transactions.transactionTime, session.checkOutTime!)
        )
      );

    // 3. Calculate Expected Cash
    // Expected Cash = Opening Cash + Cash-In (Deposit) - Cash-Out (Withdrawal)
    let expectedCash = session.openingCash
      ? parseFloat(session.openingCash.toString())
      : 0;

    // We also need to consider commissions that were paid INSTANTLY (if any)
    // In this model, we'll assume commissions are handled separately unless specified

    for (const txn of shiftTxns) {
      const amount = parseFloat(txn.amount.toString());
      if (txn.type === "cash_in") {
        expectedCash += amount;
      } else if (txn.type === "cash_out") {
        expectedCash -= amount;
      }
      // Note: Other transaction types (airtime, bills) are usually float-based, not cash-based
      // unless the customer pays cash. For simplicity, we assume cash_in/out are the primary cash drivers.
    }

    // 4. Calculate Discrepancy
    const actualCash = session.closingCash
      ? parseFloat(session.closingCash.toString())
      : 0;
    const discrepancy = actualCash - expectedCash;

    // 5. Update Record
    await db
      .update(checkIns)
      .set({
        expectedClosingCash: expectedCash.toString(),
        discrepancyAmount: discrepancy.toString(),
        status: Math.abs(discrepancy) > 1 ? "discrepancy" : "verified",
      })
      .where(eq(checkIns.id, checkInId));

    // 6. Automated Shortage Penalty & Audit
    if (discrepancy < -1) {
      const shortage = Math.abs(discrepancy);
      // Create a formal penalty record in the ledger to recover funds
      await db.insert(commissionLedger).values({
        employeeId: session.employeeId,
        providerId: 1, // System default recovery provider
        amount: shortage.toString(),
        type: "shortage_penalty",
        status: "cleared",
        earnedAt: new Date(),
        payoutReference: `AUTO-SHORT-PENALTY-SESSION-${checkInId}`,
      });

      // Notify Worker (via system alerts they see on portal)
      await this.triggerAlert(
        session.employeeId,
        "⚠️ PENALTY CAUTION: Cash Shortage",
        `Critical: Your cash-on-hand is short by $${shortage.toFixed(2)}. A penalty has been deducted from your earnings. Continuous shorts will lead to termination.`,
        "critical"
      );

      // Notify Admin
      await this.triggerAlert(
        session.employeeId,
        "🚨 ADMIN ALERT: Agent Financial Leakage",
        `Agent ${employeeCode} reported a short of $${shortage.toFixed(2)} at Checkout. System has automatically applied a shortage_penalty charge to their ledger.`,
        "critical"
      );
    } else if (discrepancy > 5) {
      // Alert for excess if somehow they have MORE money (unusual)
      await this.triggerAlert(
        session.employeeId,
        "Financial Discrepancy (Excess): Worker " + employeeCode,
        `Worker reported ${actualCash.toFixed(2)} cash, but system expected ${expectedCash.toFixed(2)}. Diff: ${discrepancy.toFixed(2)}`,
        "high"
      );
    }

    return {
      expectedCash,
      actualCash,
      discrepancy,
      status: Math.abs(discrepancy) > 1 ? "discrepancy" : "verified",
    };
  }

  private async triggerAlert(
    employeeId: number,
    title: string,
    message: string,
    severity: "high" | "critical"
  ) {
    const db = await getDb();
    if (!db) return;

    // Create a generic security alert
    await db.insert(alertHistory).values({
      alertConfigId: 1, // Default security config
      title,
      message,
      severity,
      status: "triggered",
      triggeredAt: new Date(),
      metadata: { employeeId },
    });
  }
}

export const workforceService = new WorkforceService();
