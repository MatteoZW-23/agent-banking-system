import {
  RestProviderAdapter,
  ProviderTransaction,
  FloatBalance,
  ProviderConfig,
  ProviderCredentials,
} from "./providerAdapter";

interface TolaTransaction {
  id: string;
  amount: string;
  commission: string;
  type: string;
  state: string;
  created: string;
  txnRef: string;
  narrative: string;
}

interface TolaFloatResponse {
  balance: string;
  currency: string;
  lastUpdate: string;
}

/**
 * Tola Mobile aggregator provider adapter
 */
export class TolaAdapter extends RestProviderAdapter {
  async authenticate(): Promise<void> {
    try {
      await this.retryWithBackoff(async () => {
        const response = await fetch(`${this.config.apiEndpoint}/api/v2/auth`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: this.credentials.clientId,
            password: this.credentials.clientSecret,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Tola Mobile authentication failed: ${response.status}`
          );
        }

        const data = (await response.json()) as { token: string };
        this.credentials.accessToken = data.token;
      });
    } catch (error) {
      console.error("[Tola Mobile] Authentication failed:", error);
      throw new Error(
        `Tola Mobile authentication failed: ${error instanceof Error ? error.message : String(error)}`
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
        const url = new URL(`${this.config.apiEndpoint}/api/v2/transactions`);
        url.searchParams.append(
          "startDate",
          fromDate.toISOString().split("T")[0]
        );
        url.searchParams.append("endDate", toDate.toISOString().split("T")[0]);

        const res = await fetch(url.toString(), {
          method: "GET",
          headers: this.getDefaultHeaders(),
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch transactions: ${res.status}`);
        }

        return (await res.json()) as { data: TolaTransaction[] };
      });

      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }

      return response.data.map(txn => this.normalizeTransaction(txn));
    } catch (error) {
      console.error("[Tola Mobile] Failed to fetch transactions:", error);
      throw new Error(
        `Tola Mobile transaction fetch failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getFloatBalance(): Promise<FloatBalance> {
    await this.authenticate();

    try {
      const response = await this.retryWithBackoff(async () => {
        const res = await fetch(
          `${this.config.apiEndpoint}/api/v2/wallet/balance`,
          {
            method: "GET",
            headers: this.getDefaultHeaders(),
          }
        );

        if (!res.ok) {
          throw new Error(`Failed to get balance: ${res.status}`);
        }

        return (await res.json()) as TolaFloatResponse;
      });

      const balance = parseFloat(response.balance);

      return {
        balance,
        currency: response.currency,
        lastUpdated: new Date(response.lastUpdate),
      };
    } catch (error) {
      console.error("[Tola Mobile] Failed to get balance:", error);
      throw new Error(
        `Tola Mobile balance fetch failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.authenticate();
      const float = await this.getFloatBalance();
      return float.balance >= 0;
    } catch (error) {
      console.error("[Tola Mobile] Health check failed:", error);
      return false;
    }
  }

  protected getDefaultHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.credentials.accessToken || ""}`,
      "X-API-Version": "2.0",
    };
  }

  protected normalizeTransaction(txn: TolaTransaction): ProviderTransaction {
    return {
      reference: txn.txnRef,
      amount: parseFloat(txn.amount),
      fee: parseFloat(txn.commission),
      type: this.mapTransactionType(txn.type),
      timestamp: new Date(txn.created),
      status: this.mapStatus(txn.state),
      metadata: {
        description: txn.narrative,
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
