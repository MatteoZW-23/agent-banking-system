import { RestProviderAdapter, ProviderTransaction, FloatBalance, ProviderConfig, ProviderCredentials } from "./providerAdapter";

interface NMBTransaction {
  transactionId: string;
  amount: string;
  charges: string;
  type: string;
  status: string;
  dateTime: string;
  reference: string;
  description: string;
}

interface NMBFloatResponse {
  accountId: string;
  balance: string;
  availableBalance: string;
  currency: string;
  updateTime: string;
}

/**
 * NMB Bank API provider adapter
 */
export class NMBBankAdapter extends RestProviderAdapter {
  async authenticate(): Promise<void> {
    try {
      await this.retryWithBackoff(async () => {
        const response = await fetch(`${this.config.apiEndpoint}/oauth/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: this.credentials.clientId || "",
            client_secret: this.credentials.clientSecret || "",
            scope: "agent_banking",
          }).toString(),
        });

        if (!response.ok) {
          throw new Error(`NMB Bank authentication failed: ${response.status}`);
        }

        const data = (await response.json()) as { access_token: string };
        this.credentials.accessToken = data.access_token;
      });
    } catch (error) {
      console.error("[NMB Bank] Authentication failed:", error);
      throw new Error(`NMB Bank authentication failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async fetchTransactions(fromDate: Date, toDate: Date): Promise<ProviderTransaction[]> {
    await this.authenticate();

    try {
      const response = await this.retryWithBackoff(async () => {
        const url = new URL(`${this.config.apiEndpoint}/api/v1/transactions`);
        url.searchParams.append("from", fromDate.toISOString());
        url.searchParams.append("to", toDate.toISOString());

        const res = await fetch(url.toString(), {
          method: "GET",
          headers: this.getDefaultHeaders(),
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch transactions: ${res.status}`);
        }

        return (await res.json()) as { transactions: NMBTransaction[] };
      });

      if (!response.transactions || !Array.isArray(response.transactions)) {
        return [];
      }

      return response.transactions.map((txn) => this.normalizeTransaction(txn));
    } catch (error) {
      console.error("[NMB Bank] Failed to fetch transactions:", error);
      throw new Error(`NMB Bank transaction fetch failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getFloatBalance(): Promise<FloatBalance> {
    await this.authenticate();

    try {
      const response = await this.retryWithBackoff(async () => {
        const res = await fetch(`${this.config.apiEndpoint}/api/v1/accounts/balance`, {
          method: "GET",
          headers: this.getDefaultHeaders(),
        });

        if (!res.ok) {
          throw new Error(`Failed to get balance: ${res.status}`);
        }

        return (await res.json()) as NMBFloatResponse;
      });

      const balance = parseFloat(response.availableBalance);

      return {
        balance,
        currency: response.currency,
        lastUpdated: new Date(response.updateTime),
      };
    } catch (error) {
      console.error("[NMB Bank] Failed to get balance:", error);
      throw new Error(`NMB Bank balance fetch failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.authenticate();
      const float = await this.getFloatBalance();
      return float.balance >= 0;
    } catch (error) {
      console.error("[NMB Bank] Health check failed:", error);
      return false;
    }
  }

  protected getDefaultHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.credentials.accessToken || ""}`,
      "X-Request-ID": `req-${Date.now()}`,
    };
  }

  protected normalizeTransaction(txn: NMBTransaction): ProviderTransaction {
    return {
      reference: txn.reference,
      amount: parseFloat(txn.amount),
      fee: parseFloat(txn.charges),
      type: this.mapTransactionType(txn.type),
      timestamp: new Date(txn.dateTime),
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

  protected mapStatus(status: string): "completed" | "pending" | "failed" | "reversed" {
    const mapping: Record<string, "completed" | "pending" | "failed" | "reversed"> = {
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
