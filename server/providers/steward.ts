import {
  RestProviderAdapter,
  ProviderTransaction,
  FloatBalance,
} from "./providerAdapter";

/**
 * Steward Bank provider adapter
 */
export class StewardAdapter extends RestProviderAdapter {
  async authenticate(): Promise<void> {
    // API key or OAuth authentication
    console.log("[Steward] Authenticating with Steward Bank API");
  }

  async fetchTransactions(
    fromDate: Date,
    toDate: Date
  ): Promise<ProviderTransaction[]> {
    await this.authenticate();
    // Implementation would fetch from Steward API
    return [];
  }

  async getFloatBalance(): Promise<FloatBalance> {
    await this.authenticate();
    return { balance: 0, currency: "ZWL", lastUpdated: new Date() };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  protected getDefaultHeaders(): Record<string, string> {
    return { "Content-Type": "application/json" };
  }

  protected normalizeTransaction(txn: any): ProviderTransaction {
    return {
      reference: txn.reference || "",
      amount: 0,
      fee: 0,
      type: "cash_in",
      timestamp: new Date(),
      status: "pending",
    };
  }
}
