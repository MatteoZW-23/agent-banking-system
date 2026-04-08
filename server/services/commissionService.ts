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
  instantCommission: number;  // Disbursed immediately (e.g. InnBucks)
  accruedCommission: number;  // Accumulated for payout (e.g. EcoCash)
  estimatedSalary: number;    // 15% of totalCommission
  salaryPercentage: number;   // default 15
  commissionBreakdown: Array<{
    transactionType: string;
    count: number;
    amount: number;
    commission: number;
    payoutFrequency: string;
  }>;
}

export class CommissionService {
  // Alias for backward compatibility
  generateReport(startDate: Date, endDate: Date) {
    return this.getCommissionReport(startDate, endDate);
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

    const breakdown: Record<
      string,
      { count: number; amount: number; commission: number; payoutFrequency: string }
    > = {};
    let totalAmount = 0;
    let totalCommission = 0;
    let instantCommission = 0;
    let accruedCommission = 0;

    for (const txn of txns) {
      const amount =
        typeof txn.amount === "string"
          ? parseFloat(txn.amount)
          : (txn.amount as number);
      const type = txn.type;

      // Get commission structure for this provider and type
      const structure = await this.getTransactionCommissionStructure(
        txn.providerId,
        type,
        amount
      );

      const commission = this.calculateCommissionFromStructure(structure, amount);
      const frequency = structure?.payoutFrequency || "monthly";

      if (!breakdown[type]) {
        breakdown[type] = { count: 0, amount: 0, commission: 0, payoutFrequency: frequency };
      }

      breakdown[type].count += 1;
      breakdown[type].amount += amount;
      totalAmount += amount;

      breakdown[type].commission += commission;
      totalCommission += commission;

      if (frequency === "instant") {
        instantCommission += commission;
      } else {
        accruedCommission += commission;
      }
    }

    const percentage = employee[0].salaryPercentage 
      ? typeof employee[0].salaryPercentage === 'string' 
        ? parseFloat(employee[0].salaryPercentage) 
        : (employee[0].salaryPercentage as number)
      : 15.00;

    return {
      employeeCode,
      employeeName: employee[0].name,
      transactionCount: txns.length,
      totalAmount,
      totalCommission,
      instantCommission,
      accruedCommission,
      estimatedSalary: (totalCommission * percentage) / 100,
      salaryPercentage: percentage,
      commissionBreakdown: Object.entries(breakdown).map(([type, data]) => ({
        transactionType: type,
        ...data,
      })),
    };
  }

  private calculateCommissionFromStructure(structure: any, amount: number): number {
    if (!structure) return 0;
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

    return (amount * percentage) / 100 + fixed;
  }

  private async getTransactionCommissionStructure(
    providerId: number,
    transactionType: string,
    amount: number
  ): Promise<any | null> {
    const { getCommissionStructures } = await import("../db");
    const structures = await getCommissionStructures(providerId);

    // Filter by type and find a matching band if applicable (future logic)
    const matching = structures.find((s: any) => s.transactionType === transactionType);
    return matching || null;
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
    instantCommission: number;
    accruedCommission: number;
    totalPayroll: number; // 15% share
    bossShare: number;   // 85% share
    employeeCount: number;
    details: CommissionCalculation[];
  }> {
    const details = await this.calculateTotalCommission(startDate, endDate);
    const totalCommission = details.reduce(
      (sum, emp) => sum + emp.totalCommission,
      0
    );
    const instantCommission = details.reduce(
      (sum, emp) => sum + emp.instantCommission,
      0
    );
    const accruedCommission = details.reduce(
      (sum, emp) => sum + emp.accruedCommission,
      0
    );
    const totalPayroll = details.reduce(
      (sum, emp) => sum + emp.estimatedSalary,
      0
    );
    
    // 5% Supervisor Reward (Operational Assistant)
    const supervisorPool = (totalCommission * 5) / 100;

    return {
      period: `${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`,
      totalCommission,
      instantCommission,
      accruedCommission,
      totalPayroll,
      supervisorPool,
      bossShare: totalCommission - totalPayroll - supervisorPool,
      employeeCount: details.length,
      details,
    };
  }

  /**
   * Convert earned commission into operational capital (Cash or Float)
   */
  async convertCommissionToCapital(
    employeeId: number,
    amount: number,
    targetType: "cash" | "float",
    providerId?: number // Required if converting to float
  ) {
    const db = await getDb();
    if (!db) return;

    // 1. Verify available cleared commission
    const ledgerEntries = await db
      .select()
      .from(commissionLedger)
      .where(
        and(
          eq(commissionLedger.employeeId, employeeId),
          eq(commissionLedger.status, "cleared"),
          eq(commissionLedger.type, "earning")
        )
      )
      .orderBy(commissionLedger.earnedAt);

    const available = ledgerEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || "0"), 0);
    
    if (available < amount) {
      throw new Error(`Insufficient cleared commission. Available: $${available.toFixed(2)}`);
    }

    // 2. Clear ledger entries (FIFO)
    let remainingToClear = amount;
    for (const entry of ledgerEntries) {
      if (remainingToClear <= 0) break;
      const entryAmt = parseFloat(entry.amount || "0");
      const clearAmt = Math.min(entryAmt, remainingToClear);

      await db
        .update(commissionLedger)
        .set({
          status: "cleared", // Keep cleared but mark as disbursed? 
          // Actually, our status is pending/cleared/failed. 
          // Let's create a disbursement entry instead to balance it out.
        } as any)
        .where(eq(commissionLedger.id, entry.id));
      
      remainingToClear -= clearAmt;
    }

    // Insert balancing disbursement entry in ledger
    await db.insert(commissionLedger).values({
      employeeId,
      providerId: providerId || 1, // Default to 1 if cash
      amount: amount.toString(),
      type: "disbursement",
      status: "cleared",
      earnedAt: new Date(),
      payoutReference: `COMM_CONV_${targetType.toUpperCase()}_${Date.now()}`
    } as any);

    // 3. Create the Transaction to increase Agent Position
    const { employees } = await import("../../drizzle/schema");
    const emp = await db.select({ code: employees.uniqueCode }).from(employees).where(eq(employees.id, employeeId)).limit(1);
    const employeeCode = emp[0]?.code || "UNKNOWN";

    await db.insert(transactions).values({
      providerId: providerId || 1,
      employeeCode,
      type: targetType === "cash" ? "salary_disbursement" : "float_purchase",
      amount: amount.toString(),
      status: "completed",
      providerReference: `INTERNAL_COMM_CONV_${Date.now()}`,
      internalReference: `COMM_CONV_${employeeId}_${Date.now()}`,
      transactionTime: new Date(),
      metadata: { 
        is_commission_refill: true,
        conversion_target: targetType
      }
    });

    return { success: true, converted: amount, target: targetType };
  }
}

export const commissionService = new CommissionService();
