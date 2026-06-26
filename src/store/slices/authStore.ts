import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { authService, userService } from '../../config/restClient';

interface User {
  _id: string;
  name: string;
  email: string;
  plan: 'free' | 'premium';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;

  // Actions
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkToken: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  isInitialized: false,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(credentials);
      set({ user: data.user, token: data.access_token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Login failed', isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(data);
      set({ user: response.user, token: response.access_token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Registration failed', isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, token: null, isAuthenticated: false });
  },

  deleteAccount: async () => {
    await authService.logout();
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkToken: async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        // Set token immediately so axios interceptor has it before any fetches
        set({ token, isAuthenticated: true, isInitialized: true });
        // Validate token by fetching profile in background; only log out on explicit 401
        await get().fetchProfile();
      } else {
        set({ isInitialized: true });
      }
    } catch (e) {
      set({ isInitialized: true });
    }
  },

  fetchProfile: async () => {
    try {
      const user = await userService.getProfile();
      set({ user });
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401) {
        // Token is expired or invalid — force re-login
        console.log('[Auth] Token expired, logging out');
        await get().logout();
      }
      // For network errors (no internet, server down) — keep user logged in
      console.log('[Auth] Profile fetch failed (network?):', error?.message);
    }
  }
}));
