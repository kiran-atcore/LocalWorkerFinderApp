import { create } from 'zustand';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  has_worker_profile?: boolean;
  profile_photo?: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  activeRole: 'customer' | 'worker';
  setAuth: (user: User) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setActiveRole: (role: 'customer' | 'worker') => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: true, // Initially true while we check session
  activeRole: 'customer',
  setAuth: (user) => set({ isAuthenticated: true, user, isLoading: false }),
  clearAuth: () => set({ isAuthenticated: false, user: null, isLoading: false, activeRole: 'customer' }),
  setLoading: (loading) => set({ isLoading: loading }),
  setActiveRole: (role) => set({ activeRole: role }),
}));
