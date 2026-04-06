import { RestProviderAdapter, ProviderTransaction, FloatBalance } from "./providerAdapter";

/**
 * Nedbank mTLS provider adapter
 */
export class NedbankAdapter extends RestProviderAdapter {
  async authenticate(): Promise<void> {
    // mTLS authentication handled by certificate in credentials
    console.log("[Nedbank] Using mTLS certificate authentication");
  }

  async fetchTransactions(fromDate: Date, toDate: Date): Promise<ProviderTransaction[]> {
    await this.authenticate();
    // Implementation would use mTLS client certificates
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
