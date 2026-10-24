// ==============================================================================
// Lekha Jokha - Dedicated Mobile Android Frontend Configuration
// ==============================================================================

export const ENV = {
  // Production URL default; fallback to Android emulator host loopback or LAN IP in dev
  PRODUCTION_API_BASE_URL: 'https://api.lekhajokha.in',
  EMULATOR_API_BASE_URL: 'http://10.0.2.2:3000',
  LOCAL_API_BASE_URL: 'http://127.0.0.1:3000',
  
  // Active API URL resolver
  getApiBaseUrl(): string {
    if (typeof process !== 'undefined' && process.env && process.env.API_BASE_URL) {
      return process.env.API_BASE_URL;
    }
    // Default to local/emulator in development, production when released
    return this.LOCAL_API_BASE_URL;
  },

  APP_NAME: 'Lekha Jokha',
  APP_VERSION: '2.0.0',
  PACKAGE_NAME: 'in.lekhajokha.app',
  BUILD_CODE: 200,

  DEFAULT_LOCALE: 'en', // 'en' | 'hi'
  SUPPORTED_LOCALES: ['en', 'hi'] as const,

  RATE_LIMIT_RETRY_MS: 1500,
  MAX_RETRIES: 3,
  NETWORK_TIMEOUT_MS: 15000
};
