import axios from 'axios';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  // Android emulator uses 10.0.2.2 to point to host localhost
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/'; 
  }
  return 'http://localhost:8000/api/';
};

export const getImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('file://')) return path;
  
  const base = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
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
