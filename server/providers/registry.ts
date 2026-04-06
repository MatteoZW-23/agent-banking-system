import { ProviderAdapter, ProviderConfig, ProviderCredentials } from "./providerAdapter";
import { EcoCashAdapter } from "./ecocash";
import { OneMoneyAdapter } from "./onemoney";
import { InnBucksAdapter } from "./innbucks";
import { ZBBankAdapter } from "./zbbank";
import { CBZBankAdapter } from "./cbzbank";
import { NMBBankAdapter } from "./nmbbank";
import { PaynowAdapter } from "./paynow";
import { PawaPayAdapter } from "./pawapay";
import { TolaAdapter } from "./tola";

/**
 * Provider registry for managing all provider adapters
 * Maps provider names/IDs to their corresponding adapter classes
 */
export class ProviderRegistry {
  private static adapters: Record<string, new (config: ProviderConfig, credentials: ProviderCredentials) => ProviderAdapter> = {
    ecocash: EcoCashAdapter,
    onemoney: OneMoneyAdapter,
    innbucks: InnBucksAdapter,
    zb_bank: ZBBankAdapter,
    cbz_bank: CBZBankAdapter,
    nmb_bank: NMBBankAdapter,
    paynow: PaynowAdapter,
    pawapay: PawaPayAdapter,
    tola: TolaAdapter,
  };

  /**
   * Get adapter for a specific provider
   */
  static getAdapter(providerName: string, config: ProviderConfig, credentials: ProviderCredentials): ProviderAdapter {
    const AdapterClass = this.adapters[providerName.toLowerCase()];

    if (!AdapterClass) {
      throw new Error(`No adapter found for provider: ${providerName}`);
    }

    return new AdapterClass(config, credentials);
  }

  /**
   * Get all registered provider names
   */
  static getRegisteredProviders(): string[] {
    return Object.keys(this.adapters);
  }

  /**
   * Check if provider is registered
   */
  static isProviderRegistered(providerName: string): boolean {
    return providerName.toLowerCase() in this.adapters;
  }

  /**
   * Register a new provider adapter
   */
  static registerAdapter(
    providerName: string,
    AdapterClass: new (config: ProviderConfig, credentials: ProviderCredentials) => ProviderAdapter
  ): void {
    this.adapters[providerName.toLowerCase()] = AdapterClass;
  }
}

/**
 * Provider factory for creating adapter instances
 */
export class ProviderFactory {
  /**
   * Create adapter instance for provider
   */
  static createAdapter(providerName: string, config: ProviderConfig, credentials: ProviderCredentials): ProviderAdapter {
    return ProviderRegistry.getAdapter(providerName, config, credentials);
  }

  /**
   * Get list of all supported providers
   */
  static getSupportedProviders(): string[] {
    return ProviderRegistry.getRegisteredProviders();
  }

  /**
   * Check provider support
   */
  static isSupported(providerName: string): boolean {
    return ProviderRegistry.isProviderRegistered(providerName);
  }
}
