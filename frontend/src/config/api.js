// API Configuration
// Use environment variable or fallback to localhost for development
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // Custom environment variable set explicitly
  if (envUrl && envUrl.trim()) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    // In production, if someone left localhost in .env, ignore it and use live backend
    if (import.meta.env.PROD && (trimmed.includes('localhost') || trimmed.includes('127.0.0.1'))) {
      return 'https://lms-raxwo.onrender.com';
    }
    return trimmed;
  }
  
  // In production builds (Vercel, Netlify, Render), default to your live Render backend
  if (import.meta.env.PROD) {
    return 'https://lms-raxwo.onrender.com';
  }
  
  // Development mode: default to localhost:4000
  return 'http://localhost:4000';
};

const API_BASE_URL = getApiBaseUrl();

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  API_URL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
};

// Log API configuration (helpful for debugging)
console.log('API Configuration:', API_CONFIG);

export default API_CONFIG;


