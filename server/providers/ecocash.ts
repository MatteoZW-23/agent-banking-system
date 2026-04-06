import { RestProviderAdapter, ProviderTransaction, FloatBalance, ProviderConfig, ProviderCredentials } from "./providerAdapter";

interface EcoCashTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface EcoCashTransaction {
  transactionId: string;
  amount: number;
  fee: number;
  type: string;
  status: string;
  timestamp: string;
  customerPhone: string;
  customerName?: string;
  reference: string;
}

interface EcoCashFloatResponse {
  balance: number;
  currency: string;
  lastUpdated: string;
}

export class EcoCashAdapter extends RestProviderAdapter {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: ProviderConfig, credentials: ProviderCredentials) {
    super(config, credentials);
  }

  async authenticate(): Promise<void> {
    try {
      // Proper form-encoded OAuth token request
      const params = new URLSearchParams();
      params.append("grant_type", "client_credentials");
      params.append("client_id", this.credentials.clientId || "");
      params.append("client_secret", this.credentials.clientSecret || "");

      const response = await fetch(`${this.config.apiEndpoint}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`EcoCash OAuth failed: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as EcoCashTokenResponse;

      if (!data.access_token) {
        throw new Error("No access token in OAuth response");
      }

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000;
    } catch (error) {
      console.error("[EcoCash] Authentication failed:", error);
      throw new Error(`EcoCash authentication failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async fetchTransactions(fromDate: Date, toDate: Date): Promise<ProviderTransaction[]> {
    await this.ensureAuthenticated();

    try {
      const response = await this.retryWithBackoff(async () => {
        const url = new URL(`${this.config.apiEndpoint}/agent/transactions`);
        url.searchParams.append("from", fromDate.toISOString());
        url.searchParams.append("to", toDate.toISOString());

        const res = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to fetch transactions: ${res.status} - ${errorText}`);
        }

        return (await res.json()) as { transactions: EcoCashTransaction[] };
      });

      if (!response.transactions || !Array.isArray(response.transactions)) {
        console.warn("[EcoCash] No transactions in response");
        return [];
      }

      return response.transactions.map((txn) => this.normalizeTransaction(txn));
    } catch (error) {
      console.error("[EcoCash] Failed to fetch transactions:", error);
      throw new Error(`EcoCash transaction fetch failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getFloatBalance(): Promise<FloatBalance> {
    await this.ensureAuthenticated();

    try {
      const response = await this.retryWithBackoff(async () => {
        const res = await fetch(`${this.config.apiEndpoint}/agent/float/balance`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to get float balance: ${res.status} - ${errorText}`);
        }

        return (await res.json()) as EcoCashFloatResponse;
      });

      return {
        balance: response.balance,
        currency: response.currency,
        lastUpdated: new Date(response.lastUpdated),
      };
    } catch (error) {
      console.error("[EcoCash] Failed to get float balance:", error);
      throw new Error(`EcoCash float balance fetch failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.authenticate();
      const float = await this.getFloatBalance();
      return float.balance >= 0;
    } catch (error) {
      console.error("[EcoCash] Health check failed:", error);
      return false;
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || Date.now() > this.tokenExpiry) {
      await this.authenticate();
    }
  }

  protected getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }
}
