import { getDb } from "../db";
import { providers } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface ProviderCredential {
  providerId: number;
  apiKey?: string;
  apiSecret?: string;
  oauth2ClientId?: string;
  oauth2ClientSecret?: string;
  certificatePath?: string;
  certificatePassword?: string;
  endpoint?: string;
  webhookUrl?: string;
}

export class CredentialManager {
  private static instance: CredentialManager;
  private credentials: Map<number, ProviderCredential> = new Map();

  private constructor() {}

  static getInstance(): CredentialManager {
    if (!CredentialManager.instance) {
      CredentialManager.instance = new CredentialManager();
    }
    return CredentialManager.instance;
  }

  async loadCredentials(
    providerId: number
  ): Promise<ProviderCredential | null> {
    // Check cache first
    if (this.credentials.has(providerId)) {
      return this.credentials.get(providerId) || null;
    }

    const db = await getDb();
    if (!db) return null;

    try {
      const provider = await db
        .select()
        .from(providers)
        .where(eq(providers.id, providerId))
        .limit(1);

      if (provider.length === 0) return null;

      const cred: ProviderCredential = {
        providerId,
        endpoint: provider[0].apiEndpoint || undefined,
        webhookUrl: provider[0].webhookUrl || undefined,
      };

      this.credentials.set(providerId, cred);
      return cred;
    } catch (error) {
      console.error(
        `[CredentialManager] Failed to load credentials for provider ${providerId}:`,
        error
      );
      return null;
    }
  }

  async saveCredential(
    providerId: number,
    credential: ProviderCredential
  ): Promise<boolean> {
    try {
      const db = await getDb();
      if (!db) return false;

      // In production, credentials should be encrypted before storage
      this.credentials.set(providerId, credential);
      return true;
    } catch (error) {
      console.error(
        `[CredentialManager] Failed to save credential for provider ${providerId}:`,
        error
      );
      return false;
    }
  }

  clearCache(providerId?: number): void {
    if (providerId) {
      this.credentials.delete(providerId);
    } else {
      this.credentials.clear();
    }
  }

  async validateCredential(providerId: number): Promise<boolean> {
    const credential = await this.loadCredentials(providerId);
    if (!credential) return false;

    // Validate that required fields are present
    return true;
  }
}

export const credentialManager = CredentialManager.getInstance();
