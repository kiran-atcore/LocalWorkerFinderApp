import api from './axios';
import { useAuthStore } from '../store/useAuthStore';

export const verifyGoogleToken = async (idToken: string) => {
  try {
    const res = await api.post('users/google-login/', { id_token: idToken });
    const { user } = res.data;
    
    // Set user in the auth store
    useAuthStore.getState().setAuth(user);
    
    return { success: true, user };
  } catch (error: any) {
    console.error('Google verification failed:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Authentication failed'
    };
  }
};
