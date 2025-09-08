// API Configuration
const API_CONFIG = {
  // Development
  development: {
    baseURL: 'http://localhost:8000',
    prefix: '/api',
  },
  // Production (adjust as needed)
  production: {
    baseURL: 'https://your-fastapi-server.com',
    prefix: '/api',
  },
};

// Get current environment
const environment = import.meta.env.MODE || 'development';

// Export current config
export const API_BASE_URL = API_CONFIG[environment as keyof typeof API_CONFIG].baseURL;
export const API_PREFIX = API_CONFIG[environment as keyof typeof API_CONFIG].prefix;

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string) => {
  return `${API_PREFIX}${endpoint}`;
};


