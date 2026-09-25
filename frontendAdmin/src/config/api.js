// API Configuration
// Use environment variable or fallback to localhost for development
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // In production builds, ignore localhost URLs unless explicitly intended
  if (import.meta.env.PROD) {
    if (envUrl && envUrl.trim() && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl.trim().replace(/\/+$/, '');
    }
    // Default production backend URL
    return 'https://lms-tili.onrender.com';
  }
  
  // Development mode
  if (envUrl) {
    const trimmedUrl = envUrl.trim();
    if (trimmedUrl && (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://'))) {
      return trimmedUrl.replace(/\/+$/, '');
    }
  }
  
  return 'http://localhost:4000';
};

const API_BASE_URL = getApiBaseUrl();

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  API_URL: `${API_BASE_URL}/api`,
};

// Log API configuration (helpful for debugging)
console.log('API Configuration:', API_CONFIG);

export default API_CONFIG;


