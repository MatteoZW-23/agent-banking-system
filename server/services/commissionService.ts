import { getDb } from "../db";
import {
  transactions,
  commissionStructures,
  employees,
  commissionLedger,
} from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export interface CommissionCalculation {
  employeeCode: string;
  employeeName: string;
  transactionCount: number;
  totalAmount: number;
  totalCommission: number;
  commissionBreakdown: Array<{
    transactionType: string;
    count: number;
    amount: number;
    commission: number;
  }>;
}

export class CommissionService {
  generateReport(startDate: Date, endDate: Date): any {
    throw new Error("Method not implemented.");
  }
  /**
   * Calculate commission for an employee for a date range
   */
  async calculateEmployeeCommission(
    employeeCode: string,
    startDate: Date,
    endDate: Date
  ): Promise<CommissionCalculation> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get employee details
    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.uniqueCode, employeeCode))
      .limit(1);

    if (employee.length === 0) {
      throw new Error(`Employee ${employeeCode} not found`);
    }

    // Get transactions for the employee in date range
    const txns = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.employeeCode, employeeCode),
          gte(transactions.transactionTime, startDate),
          lte(transactions.transactionTime, endDate),
          eq(transactions.status, "completed")
        )
      );

    // Group transactions by type and provider
    const breakdown: Record<
      string,
      { count: number; amount: number; commission: number }
    > = {};
    let totalAmount = 0;
    let totalCommission = 0;

    for (const txn of txns) {
      const amount =
        typeof txn.amount === "string"
          ? parseFloat(txn.amount)
          : (txn.amount as number);
      const type = txn.type;

      if (!breakdown[type]) {
        breakdown[type] = { count: 0, amount: 0, commission: 0 };
      }

      breakdown[type].count += 1;
      breakdown[type].amount += amount;
      totalAmount += amount;

      // Get commission structure for this provider and type
      const commission = await this.calculateTransactionCommission(
        txn.providerId,
        type,
        amount
      );

      breakdown[type].commission += commission;
      totalCommission += commission;
    }

    return {
      employeeCode,
      employeeName: employee[0].name,
      transactionCount: txns.length,
      totalAmount,
      totalCommission,
      commissionBreakdown: Object.entries(breakdown).map(([type, data]) => ({
        transactionType: type,
        ...data,
      })),
    };
  }

  /**
   * Calculate commission for a single transaction
   */
  private async calculateTransactionCommission(
    providerId: number,
    transactionType: string,
    amount: number
  ): Promise<number> {
    const db = await getDb();
    if (!db) return 0;

    // Get commission structure
    const structures = await db
      .select()
      .from(commissionStructures)
      .where(
        and(
          eq(commissionStructures.providerId, providerId),
          eq(commissionStructures.transactionType, transactionType),
          eq(commissionStructures.isActive, true)
        )
      );

    if (structures.length === 0) {
      return 0;
    }

    const structure = structures[0];
    const minAmount = structure.minAmount
      ? typeof structure.minAmount === "string"
        ? parseFloat(structure.minAmount)
        : (structure.minAmount as number)
      : 0;
    const maxAmount = structure.maxAmount
      ? typeof structure.maxAmount === "string"
        ? parseFloat(structure.maxAmount)
        : (structure.maxAmount as number)
      : Infinity;

    // Check if transaction amount falls within range
    if (amount < minAmount || amount > maxAmount) {
      return 0;
    }

    // Calculate commission
    const percentage = structure.commissionPercentage
      ? typeof structure.commissionPercentage === "string"
        ? parseFloat(structure.commissionPercentage)
        : (structure.commissionPercentage as number)
      : 0;
    const fixed = structure.commissionFixed
      ? typeof structure.commissionFixed === "string"
        ? parseFloat(structure.commissionFixed)
        : (structure.commissionFixed as number)
      : 0;

    const percentageCommission = (amount * percentage) / 100;
    const totalCommission = percentageCommission + fixed;

    // 2. Track in Ledger (Prevention of 'stolen' money)
    if (totalCommission > 0) {
      await db.insert(commissionLedger).values({
        employeeId: 1, // Placeholder: in production, we find employee via registrationId
        providerId,
        amount: totalCommission.toString(),
        type: "earning",
        status: structure.payoutFrequency === "instant" ? "cleared" : "pending",
        earnedAt: new Date(),
        payoutDate: this.calculatePayoutDate(structure.payoutFrequency),
      });
    }

    return totalCommission;
  }

  private calculatePayoutDate(frequency: string | null): Date {
    const date = new Date();
    if (frequency === "weekly") {
      date.setDate(date.getDate() + 7);
    } else if (frequency === "bi_weekly") {
      date.setDate(date.getDate() + 14);
    } else if (frequency === "monthly") {
      date.setMonth(date.getMonth() + 1);
    }
    return date;
  }

  /**
   * Calculate total commission for all employees in a period
   */
  async calculateTotalCommission(
    startDate: Date,
    endDate: Date
  ): Promise<CommissionCalculation[]> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get all active employees
    const allEmployees = await db
      .select()
      .from(employees)
      .where(eq(employees.status, "active"));

    const results: CommissionCalculation[] = [];

    for (const emp of allEmployees) {
      try {
        const commission = await this.calculateEmployeeCommission(
          emp.uniqueCode,
          startDate,
          endDate
        );
        if (commission.transactionCount > 0) {
          results.push(commission);
        }
      } catch (error) {
        console.error(
          `[CommissionService] Failed to calculate commission for ${emp.uniqueCode}:`,
          error
        );
      }
    }

    return results;
  }

  /**
   * Get commission report for a specific period
   */
  async getCommissionReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    period: string;
    totalCommission: number;
    employeeCount: number;
    details: CommissionCalculation[];
  }> {
    const details = await this.calculateTotalCommission(startDate, endDate);
    const totalCommission = details.reduce(
      (sum, emp) => sum + emp.totalCommission,
      0
    );

    return {
      period: `${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`,
      totalCommission,
      employeeCount: details.length,
      details,
    };
  }
}

export const commissionService = new CommissionService();
