// API Configuration
const API_CONFIG = {
  // Development
  development: {
    baseURL: 'https://backend-service-777545646871.us-central1.run.app',
    prefix: '', // No prefix - FastAPI serves directly
  },
  // Production
  production: {
    baseURL: 'https://backend-service-777545646871.us-central1.run.app',
    prefix: '', // No prefix - FastAPI serves directly
  },
};

// Get current environment - handle both Vite and Node environments
const getEnvironment = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.MODE || 'development';
  }
  return process.env.NODE_ENV || 'development';
};

const environment = getEnvironment();

// Export current config with fallback
export const API_BASE_URL =
  API_CONFIG[environment as keyof typeof API_CONFIG]?.baseURL || API_CONFIG.development.baseURL;
export const API_PREFIX =
  API_CONFIG[environment as keyof typeof API_CONFIG]?.prefix || API_CONFIG.development.prefix;

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string) => {
  return `${API_BASE_URL}${API_PREFIX}${endpoint}`;
};
