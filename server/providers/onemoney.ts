import {
  SoapProviderAdapter,
  ProviderTransaction,
  FloatBalance,
  ProviderConfig,
  ProviderCredentials,
} from "./providerAdapter";

interface OneMoneyTransaction {
  txnId: string;
  amount: string;
  fee: string;
  txnType: string;
  status: string;
  timestamp: string;
  msisdn: string;
  customerName?: string;
  reference: string;
}

interface OneMoneyFloatResponse {
  balance: string;
  currency: string;
  timestamp: string;
}

/**
 * OneMoney SOAP-based provider adapter
 * OneMoney uses SOAP protocol for API communication
 */
export class OneMoneyAdapter extends SoapProviderAdapter {
  private sessionId: string | null = null;

  constructor(config: ProviderConfig, credentials: ProviderCredentials) {
    super(config, credentials);
  }

  async authenticate(): Promise<void> {
    try {
      // SOAP login request
      const loginXml = this.buildSoapRequest("Login", {
        username: this.credentials.apiKey || "",
        password: this.credentials.apiSecret || "",
      });

      const response = await fetch(`${this.config.apiEndpoint}/soap`, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: "Login",
        },
        body: loginXml,
      });

      if (!response.ok) {
        throw new Error(`SOAP Login failed: ${response.status}`);
      }

      const responseText = await response.text();
      this.sessionId = this.extractSessionId(responseText);

      if (!this.sessionId) {
        throw new Error("No session ID in SOAP response");
      }
    } catch (error) {
      console.error("[OneMoney] Authentication failed:", error);
      throw new Error(
        `OneMoney authentication failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async fetchTransactions(
    fromDate: Date,
    toDate: Date
  ): Promise<ProviderTransaction[]> {
    await this.ensureAuthenticated();

    try {
      const response = await this.retryWithBackoff(async () => {
        const requestXml = this.buildSoapRequest("GetTransactions", {
          sessionId: this.sessionId,
          fromDate: fromDate.toISOString(),
          toDate: toDate.toISOString(),
        });

        const res = await fetch(`${this.config.apiEndpoint}/soap`, {
          method: "POST",
          headers: {
            "Content-Type": "text/xml; charset=utf-8",
            SOAPAction: "GetTransactions",
          },
          body: requestXml,
        });

        if (!res.ok) {
          throw new Error(`SOAP GetTransactions failed: ${res.status}`);
        }

        const responseText = await res.text();
        return this.parseTransactionsResponse(responseText);
      });

      return response.map(txn => this.normalizeTransaction(txn));
    } catch (error) {
      console.error("[OneMoney] Failed to fetch transactions:", error);
      throw new Error(
        `OneMoney transaction fetch failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getFloatBalance(): Promise<FloatBalance> {
    await this.ensureAuthenticated();

    try {
      const response = await this.retryWithBackoff(async () => {
        const requestXml = this.buildSoapRequest("GetBalance", {
          sessionId: this.sessionId,
        });

        const res = await fetch(`${this.config.apiEndpoint}/soap`, {
          method: "POST",
          headers: {
            "Content-Type": "text/xml; charset=utf-8",
            SOAPAction: "GetBalance",
          },
          body: requestXml,
        });

        if (!res.ok) {
          throw new Error(`SOAP GetBalance failed: ${res.status}`);
        }

        const responseText = await res.text();
        return this.parseBalanceResponse(responseText);
      });

      return {
        balance: parseFloat(response.balance),
        currency: response.currency,
        lastUpdated: new Date(response.timestamp),
      };
    } catch (error) {
      console.error("[OneMoney] Failed to get float balance:", error);
      throw new Error(
        `OneMoney float balance fetch failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.authenticate();
      const float = await this.getFloatBalance();
      return float.balance >= 0;
    } catch (error) {
      console.error("[OneMoney] Health check failed:", error);
      return false;
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.sessionId) {
      await this.authenticate();
    }
  }

  private buildSoapRequest(
    method: string,
    params: Record<string, any>
  ): string {
    const paramXml = Object.entries(params)
      .map(
        ([key, value]) => `<${key}>${this.escapeXml(String(value))}</${key}>`
      )
      .join("");

    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://onemoney.co.zw/api">
  <soap:Body>
    <tns:${method}>
      ${paramXml}
    </tns:${method}>
  </soap:Body>
</soap:Envelope>`;
  }

  private extractSessionId(responseXml: string): string | null {
    const match = responseXml.match(/<sessionId>([^<]+)<\/sessionId>/);
    return match ? match[1] : null;
  }

  private parseTransactionsResponse(
    responseXml: string
  ): OneMoneyTransaction[] {
    const transactions: OneMoneyTransaction[] = [];
    const txnMatches = Array.from(
      responseXml.matchAll(/<transaction>([\s\S]*?)<\/transaction>/g)
    );

    for (const match of txnMatches) {
      const txnXml = match[1];
      const txn: OneMoneyTransaction = {
        txnId: this.extractXmlValue(txnXml, "txnId"),
        amount: this.extractXmlValue(txnXml, "amount"),
        fee: this.extractXmlValue(txnXml, "fee"),
        txnType: this.extractXmlValue(txnXml, "txnType"),
        status: this.extractXmlValue(txnXml, "status"),
        timestamp: this.extractXmlValue(txnXml, "timestamp"),
        msisdn: this.extractXmlValue(txnXml, "msisdn"),
        customerName: this.extractXmlValue(txnXml, "customerName"),
        reference: this.extractXmlValue(txnXml, "reference"),
      };
      transactions.push(txn);
    }

    return transactions;
  }

  private parseBalanceResponse(responseXml: string): OneMoneyFloatResponse {
    return {
      balance: this.extractXmlValue(responseXml, "balance"),
      currency: this.extractXmlValue(responseXml, "currency"),
      timestamp: this.extractXmlValue(responseXml, "timestamp"),
    };
  }

  private extractXmlValue(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
    return match ? match[1] : "";
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}
