import {
  RestProviderAdapter,
  ProviderTransaction,
  FloatBalance,
  ProviderConfig,
  ProviderCredentials,
} from "./providerAdapter";

interface PaynowTransaction {
  id: string;
  amount: string;
  fee: string;
  type: string;
  status: string;
  createdAt: string;
  reference: string;
  description: string;
  merchant: string;
}

interface PaynowFloatResponse {
  balance: string;
  currency: string;
  lastSync: string;
}

/**
 * Paynow aggregator provider adapter
 */
export class PaynowAdapter extends RestProviderAdapter {
  async authenticate(): Promise<void> {
    try {
      await this.retryWithBackoff(async () => {
        const response = await fetch(
          `${this.config.apiEndpoint}/api/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              integrationKey: this.credentials.apiKey,
              integrationId: this.credentials.clientId,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Paynow authentication failed: ${response.status}`);
        }

        const data = (await response.json()) as { token: string };
        this.credentials.accessToken = data.token;
      });
    } catch (error) {
      console.error("[Paynow] Authentication failed:", error);
      throw new Error(
        `Paynow authentication failed: ${error instanceof Error ? error.message : String(error)}`
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
        const url = new URL(`${this.config.apiEndpoint}/api/transactions`);
        url.searchParams.append("from", fromDate.toISOString());
        url.searchParams.append("to", toDate.toISOString());

        const res = await fetch(url.toString(), {
          method: "GET",
          headers: this.getDefaultHeaders(),
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch transactions: ${res.status}`);
        }

        return (await res.json()) as { data: PaynowTransaction[] };
      });

      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }

      return response.data.map(txn => this.normalizeTransaction(txn));
    } catch (error) {
      console.error("[Paynow] Failed to fetch transactions:", error);
      throw new Error(
        `Paynow transaction fetch failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getFloatBalance(): Promise<FloatBalance> {
    await this.authenticate();

    try {
      const response = await this.retryWithBackoff(async () => {
        const res = await fetch(
          `${this.config.apiEndpoint}/api/account/balance`,
          {
            method: "GET",
            headers: this.getDefaultHeaders(),
          }
        );

        if (!res.ok) {
          throw new Error(`Failed to get balance: ${res.status}`);
        }

        return (await res.json()) as PaynowFloatResponse;
      });

      const balance = parseFloat(response.balance);

      return {
        balance,
        currency: response.currency,
        lastUpdated: new Date(response.lastSync),
      };
    } catch (error) {
      console.error("[Paynow] Failed to get balance:", error);
      throw new Error(
        `Paynow balance fetch failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.authenticate();
      const float = await this.getFloatBalance();
      return float.balance >= 0;
    } catch (error) {
      console.error("[Paynow] Health check failed:", error);
      return false;
    }
  }

  protected getDefaultHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.credentials.accessToken || ""}`,
      "X-API-Version": "v1",
    };
  }

  protected normalizeTransaction(txn: PaynowTransaction): ProviderTransaction {
    return {
      reference: txn.reference,
      amount: parseFloat(txn.amount),
      fee: parseFloat(txn.fee),
      type: this.mapTransactionType(txn.type),
      timestamp: new Date(txn.createdAt),
      status: this.mapStatus(txn.status),
      metadata: {
        description: txn.description,
        merchant: txn.merchant,
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
