import {
  RestProviderAdapter,
  ProviderTransaction,
  FloatBalance,
  ProviderConfig,
  ProviderCredentials,
} from "./providerAdapter";

interface CBZTransaction {
  id: string;
  amount: string;
  fee: string;
  transactionType: string;
  status: string;
  timestamp: string;
  reference: string;
  description: string;
  narration: string;
}

interface CBZFloatResponse {
  accountNumber: string;
  balance: string;
  availableBalance: string;
  currency: string;
  lastUpdate: string;
}

/**
 * CBZ Bank API provider adapter
 */
export class CBZBankAdapter extends RestProviderAdapter {
  async authenticate(): Promise<void> {
    try {
      await this.retryWithBackoff(async () => {
        const response = await fetch(`${this.config.apiEndpoint}/auth/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientId: this.credentials.clientId,
            clientSecret: this.credentials.clientSecret,
          }),
        });

        if (!response.ok) {
          throw new Error(`CBZ Bank authentication failed: ${response.status}`);
        }

        const data = (await response.json()) as { accessToken: string };
        this.credentials.accessToken = data.accessToken;
      });
    } catch (error) {
      console.error("[CBZ Bank] Authentication failed:", error);
      throw new Error(
        `CBZ Bank authentication failed: ${error instanceof Error ? error.message : String(error)}`
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

        return (await res.json()) as { data: CBZTransaction[] };
      });

      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }

      return response.data.map(txn => this.normalizeTransaction(txn));
    } catch (error) {
      console.error("[CBZ Bank] Failed to fetch transactions:", error);
      throw new Error(
        `CBZ Bank transaction fetch failed: ${error instanceof Error ? error.message : String(error)}`
      );
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

        return (await res.json()) as CBZFloatResponse;
      });

      const balance = parseFloat(response.availableBalance);

      return {
        balance,
        currency: response.currency,
        lastUpdated: new Date(response.lastUpdate),
      };
    } catch (error) {
      console.error("[CBZ Bank] Failed to get balance:", error);
      throw new Error(
        `CBZ Bank balance fetch failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.authenticate();
      const float = await this.getFloatBalance();
      return float.balance >= 0;
    } catch (error) {
      console.error("[CBZ Bank] Health check failed:", error);
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

  protected normalizeTransaction(txn: CBZTransaction): ProviderTransaction {
    return {
      reference: txn.reference,
      amount: parseFloat(txn.amount),
      fee: parseFloat(txn.fee),
      type: this.mapTransactionType(txn.transactionType),
      timestamp: new Date(txn.timestamp),
      status: this.mapStatus(txn.status),
      metadata: {
        description: txn.description,
        narration: txn.narration,
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
