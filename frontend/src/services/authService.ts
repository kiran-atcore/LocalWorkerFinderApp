import { apiClient } from './apiClient';

export const authService = {
  getCSRF: async () => apiClient.get('/users/csrf/'),
  login: async (credentials: any) => apiClient.post('/users/login/', credentials),
  logout: async () => apiClient.post('/users/logout/'),
  register: async (data: any) => apiClient.post('/users/register/', data),
};