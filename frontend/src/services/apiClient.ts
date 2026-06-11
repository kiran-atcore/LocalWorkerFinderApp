import axios from 'axios';
import CookieManager from '@react-native-cookies/cookies';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android emulators, localhost for iOS simulators
const host = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
const baseURL = `http://${host}:8000/api`; 

export const apiClient = axios.create({
  baseURL,
  withCredentials: true, // Enables session cookie sending
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  if (config.method && config.method.toLowerCase() !== 'get') {
    const cookies = await CookieManager.get(baseURL);
    if (cookies && cookies.csrftoken) {
      config.headers['X-CSRFToken'] = cookies.csrftoken.value;
    }
  }
  return config;
});