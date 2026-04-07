import {
  RestProviderAdapter,
  ProviderTransaction,
  FloatBalance,
  ProviderConfig,
  ProviderCredentials,
} from "./providerAdapter";

interface InnBucksTransaction {
  id: string;
  amount: string;
  fee: string;
  type: string;
  status: string;
  createdAt: string;
  msisdn: string;
  reference: string;
}

interface InnBucksFloatResponse {
  available: string;
  reserved: string;
  currency: string;
}

/**
 * InnBucks REST provider adapter with proprietary authentication
 */
export class InnBucksAdapter extends RestProviderAdapter {
  private apiKey: string;

  constructor(config: ProviderConfig, credentials: ProviderCredentials) {
    super(config, credentials);
    this.apiKey = credentials.apiKey || "";
  }

  async authenticate(): Promise<void> {
    try {
      // InnBucks uses API key authentication
      if (!this.apiKey) {
        throw new Error("InnBucks API key not configured");
      }
      // Validate API key by making a test request
      await this.retryWithBackoff(async () => {
        const res = await fetch(`${this.config.apiEndpoint}/validate`, {
          method: "GET",
          headers: this.getDefaultHeaders(),
        });

        if (!res.ok) {
          throw new Error(`InnBucks authentication failed: ${res.status}`);
        }
      });
    } catch (error) {
      console.error("[InnBucks] Authentication failed:", error);
      throw new Error(
        `InnBucks authentication failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async fetchTransactions(
    fromDate: Date,
    toDate: Date
  ): Promise<ProviderTransaction[]> {
    await this.authenticate();

    try {
      const response = await this.retryWithBackoff(async () => {
        const url = new URL(`${this.config.apiEndpoint}/transactions`);
        url.searchParams.append("startDate", fromDate.toISOString());
        url.searchParams.append("endDate", toDate.toISOString());

        const res = await fetch(url.toString(), {
          method: "GET",
          headers: this.getDefaultHeaders(),
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch transactions: ${res.status}`);
        }

        return (await res.json()) as { data: InnBucksTransaction[] };
      });

      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }

      return response.data.map(txn => this.normalizeTransaction(txn));
    } catch (error) {
      console.error("[InnBucks] Failed to fetch transactions:", error);
      throw new Error(
        `InnBucks transaction fetch failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getFloatBalance(): Promise<FloatBalance> {
    await this.authenticate();

    try {
      const response = await this.retryWithBackoff(async () => {
        const res = await fetch(`${this.config.apiEndpoint}/balance`, {
          method: "GET",
          headers: this.getDefaultHeaders(),
        });

        if (!res.ok) {
          throw new Error(`Failed to get balance: ${res.status}`);
        }

        return (await res.json()) as InnBucksFloatResponse;
      });

      const available = parseFloat(response.available);
      const reserved = parseFloat(response.reserved);

      return {
        balance: available,
        currency: response.currency,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error("[InnBucks] Failed to get balance:", error);
      throw new Error(
        `InnBucks balance fetch failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.authenticate();
      const float = await this.getFloatBalance();
      return float.balance >= 0;
    } catch (error) {
      console.error("[InnBucks] Health check failed:", error);
      return false;
    }
  }

  protected getDefaultHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      "X-API-Version": "2.0",
    };
  }
}
