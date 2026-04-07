import { getDb } from "../db";
import { ProviderFactory } from "../providers/registry";
import {
  transactions,
  providers as providersTable,
  agentRegistrations,
} from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface TransactionFetchResult {
  providerId: number;
  providerName: string;
  fetched: number;
  failed: number;
  errors: string[];
}

/**
 * Transaction orchestrator for fetching transactions from all providers
 */
export class TransactionOrchestrator {
  /**
   * Fetch transactions from all active providers
   */
  static async fetchFromAllProviders(
    fromDate: Date,
    toDate: Date
  ): Promise<TransactionFetchResult[]> {
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection not available");
    }

    const results: TransactionFetchResult[] = [];

    try {
      // Get all active providers
      const activeProviders = await db
        .select()
        .from(providersTable)
        .where(eq(providersTable.isActive, true));

      for (const provider of activeProviders) {
        const result = await this.fetchFromProvider(
          provider.id,
          provider.name,
          fromDate,
          toDate
        );
        results.push(result);
      }
    } catch (error) {
      console.error(
        "[TransactionOrchestrator] Error fetching from providers:",
        error
      );
    }

    return results;
  }

  /**
   * Fetch transactions from a specific provider
   */
  static async fetchFromProvider(
    providerId: number,
    providerName: string,
    fromDate: Date,
    toDate: Date
  ): Promise<TransactionFetchResult> {
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection not available");
    }

    const result: TransactionFetchResult = {
      providerId,
      providerName,
      fetched: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Get provider configuration
      const provider = await db
        .select()
        .from(providersTable)
        .where(eq(providersTable.id, providerId))
        .limit(1);

      if (!provider || provider.length === 0) {
        result.errors.push(`Provider not found: ${providerId}`);
        result.failed = 1;
        return result;
      }

      const providerConfig = provider[0];

      // Get provider credentials from agent registrations
      const agentReg = await db
        .select()
        .from(agentRegistrations)
        .where(eq(agentRegistrations.providerId, providerId))
        .limit(1);

      const credentials = {
        apiKey: agentReg[0]?.apiKeyEncrypted || "",
        apiSecret: agentReg[0]?.apiSecretEncrypted || "",
        clientId: agentReg[0]?.merchantId || "",
        clientSecret: agentReg[0]?.apiSecretEncrypted || "",
      };

      // Create adapter
      if (!ProviderFactory.isSupported(providerName)) {
        result.errors.push(`Provider not supported: ${providerName}`);
        result.failed = 1;
        return result;
      }

      const adapterConfig = {
        id: providerConfig.id,
        name: providerConfig.name,
        apiEndpoint: providerConfig.apiEndpoint || "",
        authType: providerConfig.authType,
        authConfig: providerConfig.authConfig || {},
      };

      const adapter = ProviderFactory.createAdapter(
        providerName,
        adapterConfig,
        credentials
      );

      // Fetch transactions
      const fetchedTransactions = await adapter.fetchTransactions(
        fromDate,
        toDate
      );

      // Store transactions with deduplication
      for (const txn of fetchedTransactions) {
        try {
          // Check for duplicate
          const existing = await db
            .select()
            .from(transactions)
            .where(eq(transactions.providerReference, txn.reference))
            .limit(1);

          if (existing.length === 0) {
            // Insert new transaction
            const insertData: any = {
              providerId,
              providerReference: txn.reference,
              internalReference: `${providerId}-${txn.reference}-${Date.now()}`,
              amount: txn.amount,
              fee: txn.fee,
              type: txn.type,
              status: txn.status,
              transactionTime: txn.timestamp,
              reconciliationStatus: "unreconciled",
            };

            if (txn.customerPhone) insertData.customerPhone = txn.customerPhone;
            if (txn.customerName) insertData.customerName = txn.customerName;

            await db.insert(transactions).values(insertData);
            result.fetched++;
          }
        } catch (error) {
          result.errors.push(
            `Failed to store transaction: ${error instanceof Error ? error.message : String(error)}`
          );
          result.failed++;
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`Failed to fetch from provider: ${errorMsg}`);
      result.failed = 1;
    }

    return result;
  }

  /**
   * Get transaction sync status
   */
  static async getSyncStatus(): Promise<{
    lastSync: Date | null;
    totalTransactions: number;
    pendingReconciliation: number;
    reconciled: number;
  }> {
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection not available");
    }

    try {
      const allTransactions = await db.select().from(transactions);

      const pending = allTransactions.filter(
        t => t.reconciliationStatus === "unreconciled"
      ).length;
      const reconciled = allTransactions.filter(
        t => t.reconciliationStatus === "matched"
      ).length;

      return {
        lastSync: allTransactions.length > 0 ? new Date() : null,
        totalTransactions: allTransactions.length,
        pendingReconciliation: pending,
        reconciled,
      };
    } catch (error) {
      console.error(
        "[TransactionOrchestrator] Error getting sync status:",
        error
      );
      throw error;
    }
  }
}
