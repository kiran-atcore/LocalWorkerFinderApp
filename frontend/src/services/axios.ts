import axios from 'axios';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  // Use EXPO_PUBLIC_API_URL if defined (e.g. for production cloud server)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Fallback to computer's LAN IP for local physical device testing
  return 'http://172.30.182.203:8000/api/';
};

export const getImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('file://')) return path;
  
  const base = process.env.EXPO_PUBLIC_BASE_URL || 'http://172.30.182.203:8000';
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

import CookieManager from '@react-native-cookies/cookies';

api.interceptors.request.use(
  async (config) => {
    // Only attach CSRF token to mutating requests
    if (config.method && !['get', 'head', 'options', 'trace'].includes(config.method.toLowerCase())) {
      try {
        const cookies = await CookieManager.get(config.baseURL || '');
        if (cookies.csrftoken) {
          config.headers['X-CSRFToken'] = cookies.csrftoken.value;
        }
      } catch (e) {
        console.warn('Failed to get CSRF token', e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
