import { getDb } from "../db";
import { transactions, transactionFlags } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import { eq, and, gte, lte } from "drizzle-orm";

export interface TransactionAnalysisResult {
  flagged: boolean;
  flagType:
    | "suspicious_pattern"
    | "unusual_amount"
    | "timing_anomaly"
    | "duplicate_risk"
    | "fraud_risk"
    | "other";
  riskScore: number;
  reason: string;
  llmAnalysis: Record<string, any>;
}

export class TransactionAnalysisService {
  /**
   * Analyze a transaction for suspicious patterns using LLM
   */
  async analyzeTransaction(
    transactionId: number
  ): Promise<TransactionAnalysisResult> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get transaction details
    const txn = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);

    if (txn.length === 0) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const transaction = txn[0];

    // Get historical context for the employee
    const employeeTransactions = transaction.employeeCode
      ? await db
          .select()
          .from(transactions)
          .where(eq(transactions.employeeCode, transaction.employeeCode))
          .limit(100)
      : [];

    // 0. Deterministic KYC Check (Global Standard: Block/Flag > $500 without ID)
    const amountVal = typeof transaction.amount === "string" ? parseFloat(transaction.amount) : (transaction.amount as number);
    if (amountVal > 500 && !transaction.customerNationalId) {
      await db.insert(transactionFlags).values({
        transactionId,
        flagType: "kyc_missing",
        riskScore: 1.0,
        reason: `COMPLIANCE BREACH: Transaction of ${amountVal} processed without valid Customer ID record.`,
        llmAnalysis: { manual_flag: true, rule: "KYC_THRESHOLD_500" },
        status: "flagged",
        createdAt: new Date(),
      });
      
      return {
        flagged: true,
        flagType: "kyc_missing",
        riskScore: 1.0,
        reason: "Missing Customer Identification for high-value transaction.",
        llmAnalysis: { rule: "KYC_MISSING" }
      };
    }

    // Prepare analysis prompt
    const analysisPrompt = this.buildAnalysisPrompt(
      transaction,
      employeeTransactions
    );

    try {
      // Call LLM for analysis
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a financial fraud detection expert analyzing payment transactions. Analyze the provided transaction for suspicious patterns, unusual amounts, timing anomalies, and other fraud indicators.",
          },
          {
            role: "user",
            content: analysisPrompt,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "transaction_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                flagged: { type: "boolean" },
                flagType: {
                  type: "string",
                  enum: [
                    "suspicious_pattern",
                    "unusual_amount",
                    "timing_anomaly",
                    "duplicate_risk",
                    "fraud_risk",
                    "other",
                  ],
                },
                riskScore: { type: "number", minimum: 0, maximum: 1 },
                reason: { type: "string" },
                indicators: { type: "array", items: { type: "string" } },
              },
              required: [
                "flagged",
                "flagType",
                "riskScore",
                "reason",
                "indicators",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const analysisContent = response.choices[0]?.message?.content;
      if (!analysisContent) {
        throw new Error("No response from LLM");
      }

      const analysisText =
        typeof analysisContent === "string"
          ? analysisContent
          : JSON.stringify(analysisContent);
      const analysis = JSON.parse(analysisText);

      // Store flag if transaction is flagged
      if (analysis.flagged) {
        await db.insert(transactionFlags).values({
          transactionId,
          flagType: analysis.flagType,
          riskScore: analysis.riskScore,
          reason: analysis.reason,
          llmAnalysis: analysis,
          status: "flagged",
          createdAt: new Date(),
        });
      }

      return {
        flagged: analysis.flagged,
        flagType: analysis.flagType || "other",
        riskScore: analysis.riskScore || 0,
        reason: analysis.reason || "Analysis completed",
        llmAnalysis: analysis,
      };
    } catch (error) {
      console.error("[TransactionAnalysis] LLM analysis failed:", error);
      // Return a default non-flagged response on error
      return {
        flagged: false,
        flagType: "other",
        riskScore: 0,
        reason: "Analysis failed",
        llmAnalysis: { error: String(error) },
      };
    }
  }

  /**
   * Batch analyze transactions for a date range
   */
  async analyzeTransactionsBatch(
    fromDate: Date,
    toDate: Date
  ): Promise<TransactionAnalysisResult[]> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get transactions for the date range
    const txns = await db
      .select()
      .from(transactions)
      .where(
        and(
          gte(transactions.transactionTime, fromDate),
          lte(transactions.transactionTime, toDate),
          eq(transactions.status, "completed")
        )
      );

    const results: TransactionAnalysisResult[] = [];

    for (const txn of txns) {
      try {
        const result = await this.analyzeTransaction(txn.id);
        results.push(result);
      } catch (error) {
        console.error(
          `[TransactionAnalysis] Failed to analyze transaction ${txn.id}:`,
          error
        );
      }
    }

    return results;
  }

  /**
   * Build analysis prompt with transaction and historical context
   */
  private buildAnalysisPrompt(
    transaction: any,
    employeeTransactions: any[]
  ): string {
    const amount =
      typeof transaction.amount === "string"
        ? parseFloat(transaction.amount)
        : (transaction.amount as number);
    const fee =
      typeof transaction.fee === "string"
        ? parseFloat(transaction.fee)
        : (transaction.fee as number);

    // Calculate statistics from employee history
    const amounts = employeeTransactions
      .map(t =>
        typeof t.amount === "string"
          ? parseFloat(t.amount)
          : (t.amount as number)
      )
      .filter(a => !isNaN(a));

    const avgAmount =
      amounts.length > 0
        ? amounts.reduce((a, b) => a + b, 0) / amounts.length
        : 0;
    const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 0;
    const minAmount = amounts.length > 0 ? Math.min(...amounts) : 0;

    // Count transaction types
    const typeCount: Record<string, number> = {};
    employeeTransactions.forEach(t => {
      typeCount[t.type] = (typeCount[t.type] || 0) + 1;
    });

    return `
Analyze this transaction for fraud indicators:

TRANSACTION DETAILS:
- Amount: ${amount}
- Fee: ${fee}
- Type: ${transaction.type}
- Status: ${transaction.status}
- Customer Phone: ${transaction.customerPhone || "N/A"}
- Customer Name: ${transaction.customerName || "N/A"}
- Timestamp: ${transaction.transactionTime}
- Provider: Provider ID ${transaction.providerId}
- Employee Code: ${transaction.employeeCode || "N/A"}

EMPLOYEE TRANSACTION HISTORY (Last 100 transactions):
- Total Transactions: ${employeeTransactions.length}
- Average Amount: ${avgAmount.toFixed(2)}
- Max Amount: ${maxAmount.toFixed(2)}
- Min Amount: ${minAmount.toFixed(2)}
- Transaction Types: ${JSON.stringify(typeCount)}

ANALYSIS CRITERIA:
1. Is the amount unusual compared to employee's history?
2. Is there a suspicious pattern in transaction timing?
3. Are there duplicate or near-duplicate transactions?
4. Does the transaction type match the employee's typical activity?
5. Are there any other fraud indicators?

Provide your analysis in JSON format.
    `;
  }

  /**
   * Get flagged transactions for review
   */
  async getFlaggedTransactionsForReview(limit = 50): Promise<any[]> {
    const db = await getDb();
    if (!db) return [];

    return await db
      .select()
      .from(transactionFlags)
      .where(eq(transactionFlags.status, "flagged"))
      .limit(limit);
  }

  /**
   * Review and resolve a flagged transaction
   */
  async resolveFlaggedTransaction(
    flagId: number,
    status: "resolved" | "false_positive",
    reviewedBy: number
  ): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(transactionFlags)
      .set({
        status,
        reviewedBy,
        reviewedAt: new Date(),
      })
      .where(eq(transactionFlags.id, flagId));
  }
}

export const transactionAnalysisService = new TransactionAnalysisService();
