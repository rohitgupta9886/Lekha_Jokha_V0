/**
 * EwayProviderFactory.mjs
 * 
 * Factory to instantiate the appropriate e-Way Bill provider adapter
 * based on tenant configuration and system environment.
 */

import { SandboxEwayProvider } from './SandboxEwayProvider.mjs';
import { GspGatewayProvider } from './GspGatewayProvider.mjs';
import { NicDirectEwayProvider } from './NicDirectEwayProvider.mjs';

export class EwayProviderFactory {
  /**
   * Resolves the provider instance for a business configuration
   * @param {Object} decryptedConfig - Decrypted business e-way bill configuration
   * @returns {import('./IEwayProvider.mjs').IEwayProvider}
   */
  static getProvider(decryptedConfig = {}) {
    const providerType = (decryptedConfig.provider || process.env.EWAY_PROVIDER || 'NIC_SANDBOX').toUpperCase();
    const isSandbox = decryptedConfig.isSandbox ?? (process.env.EWAY_ENVIRONMENT !== 'production');

    if (isSandbox || providerType === 'NIC_SANDBOX') {
      return new SandboxEwayProvider(decryptedConfig);
    }

    if (providerType === 'NIC_DIRECT') {
      return new NicDirectEwayProvider(decryptedConfig);
    }

    if (providerType === 'GSP_GATEWAY' || providerType === 'MASTERS_INDIA' || providerType === 'CLEARTAX') {
      return new GspGatewayProvider(decryptedConfig);
    }

    // Default to Sandbox with safety logging
    return new SandboxEwayProvider(decryptedConfig);
  }
}
