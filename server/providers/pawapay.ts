import {
  RestProviderAdapter,
  ProviderTransaction,
  FloatBalance,
  ProviderConfig,
  ProviderCredentials,
} from "./providerAdapter";

interface PawaPayTransaction {
  transactionId: string;
  amount: string;
  fee: string;
  type: string;
  status: string;
  timestamp: string;
  reference: string;
  description: string;
}

interface PawaPayFloatResponse {
  accountBalance: string;
  currency: string;
  updatedAt: string;
}

/**
 * PawaPay aggregator provider adapter
 */
export class PawaPayAdapter extends RestProviderAdapter {
  async authenticate(): Promise<void> {
    try {
      await this.retryWithBackoff(async () => {
        const response = await fetch(`${this.config.apiEndpoint}/auth/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiKey: this.credentials.apiKey,
            apiSecret: this.credentials.apiSecret,
          }),
        });

        if (!response.ok) {
          throw new Error(`PawaPay authentication failed: ${response.status}`);
        }

        const data = (await response.json()) as { accessToken: string };
        this.credentials.accessToken = data.accessToken;
      });
    } catch (error) {
      console.error("[PawaPay] Authentication failed:", error);
      throw new Error(
        `PawaPay authentication failed: ${error instanceof Error ? error.message : String(error)}`
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
        const url = new URL(`${this.config.apiEndpoint}/transactions/list`);
        url.searchParams.append("startDate", fromDate.toISOString());
        url.searchParams.append("endDate", toDate.toISOString());

        const res = await fetch(url.toString(), {
          method: "GET",
          headers: this.getDefaultHeaders(),
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch transactions: ${res.status}`);
        }

        return (await res.json()) as { transactions: PawaPayTransaction[] };
      });

      if (!response.transactions || !Array.isArray(response.transactions)) {
        return [];
      }

      return response.transactions.map(txn => this.normalizeTransaction(txn));
    } catch (error) {
      console.error("[PawaPay] Failed to fetch transactions:", error);
      throw new Error(
        `PawaPay transaction fetch failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getFloatBalance(): Promise<FloatBalance> {
    await this.authenticate();

    try {
      const response = await this.retryWithBackoff(async () => {
        const res = await fetch(`${this.config.apiEndpoint}/account/balance`, {
          method: "GET",
          headers: this.getDefaultHeaders(),
        });

        if (!res.ok) {
          throw new Error(`Failed to get balance: ${res.status}`);
        }

        return (await res.json()) as PawaPayFloatResponse;
      });

      const balance = parseFloat(response.accountBalance);

      return {
        balance,
        currency: response.currency,
        lastUpdated: new Date(response.updatedAt),
      };
    } catch (error) {
      console.error("[PawaPay] Failed to get balance:", error);
      throw new Error(
        `PawaPay balance fetch failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.authenticate();
      const float = await this.getFloatBalance();
      return float.balance >= 0;
    } catch (error) {
      console.error("[PawaPay] Health check failed:", error);
      return false;
    }
  }

  protected getDefaultHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.credentials.accessToken || ""}`,
      "X-API-Key": this.credentials.apiKey || "",
    };
  }

  protected normalizeTransaction(txn: PawaPayTransaction): ProviderTransaction {
    return {
      reference: txn.reference,
      amount: parseFloat(txn.amount),
      fee: parseFloat(txn.fee),
      type: this.mapTransactionType(txn.type),
      timestamp: new Date(txn.timestamp),
      status: this.mapStatus(txn.status),
      metadata: {
        description: txn.description,
      },
    };
  }

  protected mapTransactionType(type: string): string {
    const mapping: Record<string, string> = {
      CASH_OUT: "cash_out",
      CASH_IN: "cash_in",
      TRANSFER: "send_money",
      PAYMENT: "payment",
      DEPOSIT: "deposit",
      WITHDRAWAL: "withdrawal",
    };
    return mapping[type] || type.toLowerCase();
  }

  protected mapStatus(
    status: string
  ): "completed" | "pending" | "failed" | "reversed" {
    const mapping: Record<
      string,
      "completed" | "pending" | "failed" | "reversed"
    > = {
      SUCCESS: "completed",
      COMPLETED: "completed",
      PENDING: "pending",
      FAILED: "failed",
      REVERSED: "reversed",
      CANCELLED: "failed",
    };
    return mapping[status] || "pending";
  }
}
