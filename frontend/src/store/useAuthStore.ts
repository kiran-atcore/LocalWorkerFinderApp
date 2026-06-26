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
  isLocationLoading: boolean;
  activeRole: 'customer' | 'worker';
  hasAutoDetectedLocationSession: boolean;
  searchLocation: { latitude: number, longitude: number, address_text: string } | null;
  pendingWorkerLocation: { latitude: number, longitude: number, address_text: string } | null;
  bookingLocation: { latitude: number, longitude: number, address_text: string } | null;
  setAuth: (user: User) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setIsLocationLoading: (loading: boolean) => void;
  setActiveRole: (role: 'customer' | 'worker') => void;
  setHasAutoDetectedLocationSession: (val: boolean) => void;
  setSearchLocation: (loc: { latitude: number, longitude: number, address_text: string } | null) => void;
  setPendingWorkerLocation: (loc: { latitude: number, longitude: number, address_text: string } | null) => void;
  setBookingLocation: (loc: { latitude: number, longitude: number, address_text: string } | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: true, // Initially true while we check session
  isLocationLoading: false,
  activeRole: 'customer',
  hasAutoDetectedLocationSession: false,
  searchLocation: null,
  pendingWorkerLocation: null,
  bookingLocation: null,
  setAuth: (user) => set({ isAuthenticated: true, user, isLoading: false }),
  clearAuth: () => set({ isAuthenticated: false, user: null, isLoading: false, isLocationLoading: false, activeRole: 'customer', hasAutoDetectedLocationSession: false, searchLocation: null, pendingWorkerLocation: null, bookingLocation: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setIsLocationLoading: (loading) => set({ isLocationLoading: loading }),
  setActiveRole: (role) => set({ activeRole: role }),
  setHasAutoDetectedLocationSession: (val) => set({ hasAutoDetectedLocationSession: val }),
  setSearchLocation: (loc) => set({ searchLocation: loc }),
  setPendingWorkerLocation: (loc) => set({ pendingWorkerLocation: loc }),
  setBookingLocation: (loc) => set({ bookingLocation: loc }),
}));
