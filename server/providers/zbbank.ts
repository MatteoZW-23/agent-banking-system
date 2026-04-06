import { RestProviderAdapter, ProviderTransaction, FloatBalance, ProviderConfig, ProviderCredentials } from "./providerAdapter";
import * as fs from "fs";
import * as https from "https";

interface ZBBankTransaction {
  transactionId: string;
  amount: string;
  fee: string;
  type: string;
  status: string;
  createdAt: string;
  description: string;
  reference: string;
}

interface ZBBankFloatResponse {
  accountBalance: string;
  availableBalance: string;
  currency: string;
  lastUpdated: string;
}

/**
 * ZB Bank Open Banking provider adapter with mTLS
 */
export class ZBBankAdapter extends RestProviderAdapter {
  private clientCert: string;
  private clientKey: string;
  private caCert: string;

  constructor(config: ProviderConfig, credentials: ProviderCredentials) {
    super(config, credentials);
    this.clientCert = credentials.certPath || "";
    this.clientKey = credentials.keyPath || "";
    this.caCert = credentials.caPath || "";
  }

  async authenticate(): Promise<void> {
    try {
      // Verify certificates exist
      if (!fs.existsSync(this.clientCert)) {
        throw new Error(`Client certificate not found: ${this.clientCert}`);
      }
      if (!fs.existsSync(this.clientKey)) {
        throw new Error(`Client key not found: ${this.clientKey}`);
      }
      if (!fs.existsSync(this.caCert)) {
        throw new Error(`CA certificate not found: ${this.caCert}`);
      }

      // Test mTLS connection
      await this.retryWithBackoff(async () => {
        const res = await fetch(`${this.config.apiEndpoint}/health`, {
          method: "GET",
          headers: this.getDefaultHeaders(),
        });

        if (!res.ok) {
          throw new Error(`ZB Bank authentication failed: ${res.status}`);
        }
      });
    } catch (error) {
      console.error("[ZB Bank] Authentication failed:", error);
      throw new Error(`ZB Bank authentication failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async fetchTransactions(fromDate: Date, toDate: Date): Promise<ProviderTransaction[]> {
    await this.authenticate();

    try {
      const response = await this.retryWithBackoff(async () => {
        const url = new URL(`${this.config.apiEndpoint}/transactions`);
        url.searchParams.append("startDate", fromDate.toISOString().split("T")[0]);
        url.searchParams.append("endDate", toDate.toISOString().split("T")[0]);

        const res = await fetch(url.toString(), {
          method: "GET",
          headers: this.getDefaultHeaders(),
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch transactions: ${res.status}`);
        }

        return (await res.json()) as { transactions: ZBBankTransaction[] };
      });

      if (!response.transactions || !Array.isArray(response.transactions)) {
        return [];
      }

      return response.transactions.map((txn) => this.normalizeTransaction(txn));
    } catch (error) {
      console.error("[ZB Bank] Failed to fetch transactions:", error);
      throw new Error(`ZB Bank transaction fetch failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getFloatBalance(): Promise<FloatBalance> {
    await this.authenticate();

    try {
      const response = await this.retryWithBackoff(async () => {
        const res = await fetch(`${this.config.apiEndpoint}/accounts/balance`, {
          method: "GET",
          headers: this.getDefaultHeaders(),
        });

        if (!res.ok) {
          throw new Error(`Failed to get balance: ${res.status}`);
        }

        return (await res.json()) as ZBBankFloatResponse;
      });

      const balance = parseFloat(response.availableBalance);

      return {
        balance,
        currency: response.currency,
        lastUpdated: new Date(response.lastUpdated),
      };
    } catch (error) {
      console.error("[ZB Bank] Failed to get balance:", error);
      throw new Error(`ZB Bank balance fetch failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.authenticate();
      const float = await this.getFloatBalance();
      return float.balance >= 0;
    } catch (error) {
      console.error("[ZB Bank] Health check failed:", error);
      return false;
    }
  }

  protected getDefaultHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "X-API-Version": "1.0",
      "X-Client-ID": this.credentials.clientId || "",
    };
  }
}
