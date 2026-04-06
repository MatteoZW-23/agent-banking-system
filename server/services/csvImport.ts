import { getDb } from "../db";
import { transactions, providers } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface CSVImportRow {
  date: string;
  reference: string;
  type: "cash_in" | "cash_out" | "send_money" | "receive_money" | "bill_payment" | "airtime" | "data_bundle" | "ticket_purchase" | "bank_transfer" | "salary_disbursement" | "float_purchase" | "float_redemption";
  amount: string;
  fee?: string;
  status: "pending" | "processing" | "completed" | "failed" | "reversed" | "disputed";
  description?: string;
  employeeCode?: string;
}

export interface CSVImportResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  duplicateCount: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

/**
 * CSV Import Service for offline providers
 * Supports providers like Metbank, POSB, Agribank, MyCash
 */
export class CSVImportService {
  /**
   * Parse CSV content and import transactions
   */
  async importCSV(
    providerId: number,
    csvContent: string,
    delimiter: string = ","
  ): Promise<CSVImportResult> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result: CSVImportResult = {
      totalRows: 0,
      successCount: 0,
      failureCount: 0,
      duplicateCount: 0,
      errors: [],
    };

    try {
      // Parse CSV
      const lines = csvContent.trim().split("\n");
      const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());

      // Validate headers
      const requiredHeaders = ["date", "reference", "type", "amount", "status"];
      const hasRequiredHeaders = requiredHeaders.every((h) => headers.includes(h));

      if (!hasRequiredHeaders) {
        throw new Error(`CSV missing required headers: ${requiredHeaders.join(", ")}`);
      }

      // Get provider
      const providerData = await db
        .select()
        .from(providers)
        .where(eq(providers.id, providerId))
        .limit(1);

      if (providerData.length === 0) {
        throw new Error(`Provider ${providerId} not found`);
      }

      result.totalRows = lines.length - 1; // Exclude header

      // Process each row
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(delimiter).map((v) => v.trim());
          const row: Record<string, string> = {};

          headers.forEach((header, idx) => {
            row[header] = values[idx] || "";
          });

          // Validate required fields
          if (!row.date || !row.reference || !row.type || !row.amount || !row.status) {
            result.errors.push({
              row: i + 1,
              error: "Missing required fields",
            });
            result.failureCount++;
            continue;
          }

          // Check for duplicates
          const existing = await db
            .select()
            .from(transactions)
            .where(eq(transactions.providerReference, row.reference))
            .limit(1);

          if (existing.length > 0) {
            result.duplicateCount++;
            continue;
          }

          // Parse transaction data
          const txnDate = new Date(row.date);
          const amount = parseFloat(row.amount);
          const fee = row.fee ? parseFloat(row.fee) : 0;

          if (isNaN(txnDate.getTime())) {
            result.errors.push({
              row: i + 1,
              error: "Invalid date format",
            });
            result.failureCount++;
            continue;
          }

          if (isNaN(amount)) {
            result.errors.push({
              row: i + 1,
              error: "Invalid amount",
            });
            result.failureCount++;
            continue;
          }

          // Insert transaction
          const internalRef = `CSV-${providerId}-${row.reference}-${Date.now()}`;
          await db.insert(transactions).values({
            providerId,
            providerReference: row.reference,
            internalReference: internalRef,
            type: row.type as any,
            amount: amount.toString(),
            fee: fee.toString(),
            status: row.status as any,
            transactionTime: txnDate,
            employeeCode: row.employeeCode || null,
            reconciliationStatus: "unreconciled",
            metadata: row.description ? { description: row.description } : null,
          });

          result.successCount++;
        } catch (error) {
          result.errors.push({
            row: i + 1,
            error: error instanceof Error ? error.message : String(error),
          });
          result.failureCount++;
        }
      }

      return result;
    } catch (error) {
      throw new Error(`CSV import failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate CSV format before import
   */
  validateCSVFormat(csvContent: string, delimiter: string = ","): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      const lines = csvContent.trim().split("\n");

      if (lines.length < 2) {
        errors.push("CSV must contain at least header and one data row");
        return { valid: false, errors };
      }

      const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());
      const requiredHeaders = ["date", "reference", "type", "amount", "status"];

      for (const required of requiredHeaders) {
        if (!headers.includes(required)) {
          errors.push(`Missing required header: ${required}`);
        }
      }

      // Validate data rows
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        const values = lines[i].split(delimiter);
        if (values.length !== headers.length) {
          errors.push(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      errors.push(`CSV parsing error: ${error instanceof Error ? error.message : String(error)}`);
      return { valid: false, errors };
    }
  }

  /**
   * Generate CSV template for a provider
   */
  generateCSVTemplate(providerName: string): string {
    const headers = ["Date", "Reference", "Type", "Amount", "Fee", "Status", "Description", "EmployeeCode"];
    const sampleRows = [
      ["2026-04-06", "TXN001", "cash_out", "100.00", "2.50", "completed", "Cash withdrawal", "EMP001"],
      ["2026-04-06", "TXN002", "cash_in", "250.00", "5.00", "completed", "Cash deposit", "EMP002"],
      ["2026-04-05", "TXN003", "send_money", "500.00", "10.00", "completed", "Money transfer", "EMP001"],
    ];

    const csvContent = [
      `# CSV Import Template for ${providerName}`,
      `# Date format: YYYY-MM-DD`,
      `# Type: cash_out, cash_in, send_money, receive_money, bill_payment, airtime`,
      `# Status: completed, pending, failed`,
      "",
      headers.join(","),
      ...sampleRows.map((row) => row.join(",")),
    ].join("\n");

    return csvContent;
  }
}

export const csvImportService = new CSVImportService();
