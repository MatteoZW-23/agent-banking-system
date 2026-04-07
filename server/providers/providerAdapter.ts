/**
 * Base provider adapter interface for multi-provider support
 * Supports REST, SOAP, and Open Banking patterns
 */

export interface ProviderTransaction {
  reference: string;
  amount: number;
  fee: number;
  type: string;
  customerPhone?: string;
  customerName?: string;
  timestamp: Date;
  status: "completed" | "pending" | "failed" | "reversed";
  metadata?: Record<string, any>;
}

export interface FloatBalance {
  balance: number;
  lastUpdated: Date;
  currency: string;
}

export interface ProviderConfig {
  id: number;
  name: string;
  apiEndpoint: string;
  authType: "oauth2" | "apikey" | "basic" | "mtls" | "none";
  authConfig: Record<string, any>;
  webhookUrl?: string;
}

export interface ProviderCredentials {
  apiKey?: string;
  apiSecret?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  agentCode?: string;
  merchantId?: string;
  certPath?: string;
  keyPath?: string;
  caPath?: string;
}

export abstract class ProviderAdapter {
  protected config: ProviderConfig;
  protected credentials: ProviderCredentials;

  constructor(config: ProviderConfig, credentials: ProviderCredentials) {
    this.config = config;
    this.credentials = credentials;
  }

  /**
   * Authenticate with the provider
   */
  abstract authenticate(): Promise<void>;

  /**
   * Fetch transactions for a date range
   */
  abstract fetchTransactions(
    fromDate: Date,
    toDate: Date
  ): Promise<ProviderTransaction[]>;

  /**
   * Get current float balance
   */
  abstract getFloatBalance(): Promise<FloatBalance>;

  /**
   * Verify provider connection
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * Normalize transaction data to unified format
   */
  protected normalizeTransaction(rawTxn: any): ProviderTransaction {
    return {
      reference: rawTxn.reference || rawTxn.id,
      amount: parseFloat(rawTxn.amount || 0),
      fee: parseFloat(rawTxn.fee || 0),
      type: this.mapTransactionType(rawTxn.type),
      customerPhone: rawTxn.customerPhone || rawTxn.phone,
      customerName: rawTxn.customerName || rawTxn.name,
      timestamp: new Date(rawTxn.timestamp || rawTxn.date),
      status: this.mapStatus(rawTxn.status),
      metadata: rawTxn.metadata || {},
    };
  }

  /**
   * Map provider-specific transaction types to unified types
   */
  protected mapTransactionType(type: string): string {
    const typeMap: Record<string, string> = {
      cash_out: "cash_out",
      cash_in: "cash_in",
      send_money: "send_money",
      receive_money: "receive_money",
      bill_payment: "bill_payment",
      airtime: "airtime",
      data_bundle: "data_bundle",
      bank_transfer: "bank_transfer",
      salary_disbursement: "salary_disbursement",
      float_purchase: "float_purchase",
      float_redemption: "float_redemption",
    };
    return typeMap[type] || "other";
  }

  /**
   * Map provider-specific status to unified status
   */
  protected mapStatus(
    status: string
  ): "completed" | "pending" | "failed" | "reversed" {
    const statusMap: Record<
      string,
      "completed" | "pending" | "failed" | "reversed"
    > = {
      success: "completed",
      completed: "completed",
      successful: "completed",
      pending: "pending",
      processing: "pending",
      failed: "failed",
      error: "failed",
      reversed: "reversed",
      refunded: "reversed",
    };
    return statusMap[status.toLowerCase()] || "pending";
  }

  /**
   * Handle API errors with retry logic
   */
  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("Max retries exceeded");
  }
}

/**
 * REST-based provider adapter
 */
export abstract class RestProviderAdapter extends ProviderAdapter {
  protected async makeRequest<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const url = `${this.config.apiEndpoint}${endpoint}`;
    const defaultHeaders = this.getDefaultHeaders();
    const finalHeaders = { ...defaultHeaders, ...headers };

    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  }

  protected getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.config.authType === "apikey" && this.credentials.apiKey) {
      headers["Authorization"] = `Bearer ${this.credentials.apiKey}`;
    } else if (
      this.config.authType === "basic" &&
      this.credentials.apiKey &&
      this.credentials.apiSecret
    ) {
      const encoded = Buffer.from(
        `${this.credentials.apiKey}:${this.credentials.apiSecret}`
      ).toString("base64");
      headers["Authorization"] = `Basic ${encoded}`;
    }

    return headers;
  }
}

/**
 * SOAP-based provider adapter
 */
export abstract class SoapProviderAdapter extends ProviderAdapter {
  protected async makeSoapRequest<T>(
    methodName: string,
    params: Record<string, any>
  ): Promise<T> {
    // SOAP implementation would go here
    // This is a placeholder for SOAP-based providers like OneMoney
    throw new Error("SOAP adapter not fully implemented");
  }
}

/**
 * Provider adapter factory
 */
export class ProviderAdapterFactory {
  static createAdapter(
    config: ProviderConfig,
    credentials: ProviderCredentials,
    adapterClass: new (
      config: ProviderConfig,
      credentials: ProviderCredentials
    ) => ProviderAdapter
  ): ProviderAdapter {
    return new adapterClass(config, credentials);
  }
}
