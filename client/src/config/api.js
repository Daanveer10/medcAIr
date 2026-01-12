// API Configuration
// Uses relative URLs - Vercel will route /api/* to the serverless function
// No localhost fallbacks - production-ready only

const getApiUrl = () => {
  // If explicitly set via environment variable, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Always use relative URLs - works with Vercel deployment
  return '/api';
};

export const API_URL = getApiUrl();
