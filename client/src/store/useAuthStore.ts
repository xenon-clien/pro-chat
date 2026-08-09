import { create } from 'zustand';
import api from '../lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isNitro?: boolean;
  nitroTier?: 'classic' | 'nitro';
  bannerColor?: string;
  bannerUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setAuth: (user: User, token: string) => void;
  guestLogin: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<User>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Check local storage for initial state
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  let initialUser: User | null = null;
  
  if (userStr) {
    try {
      initialUser = JSON.parse(userStr);
    } catch (e) {
      console.error('Failed to parse user from localStorage');
    }
  }

  return {
    user: initialUser,
    token: token,
    isAuthenticated: !!token,
    isLoading: false,
    error: null,
    
    setAuth: (user, token) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    },

    guestLogin: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post('/auth/guest');
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        set({ user: response.data.user, token: response.data.token, isAuthenticated: true, isLoading: false });
      } catch (err: any) {
        console.warn('Backend API offline, activating instant local guest session:', err);
        const fallbackUser: User = {
          id: 'guest-' + Math.random().toString(36).substring(2, 8),
          email: 'guest@prochat.io',
          name: 'Pro Guest',
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ProGuest&backgroundColor=fbbf24',
          isNitro: true,
          nitroTier: 'nitro',
        };
        const fallbackToken = 'demo-token-' + Date.now();
        localStorage.setItem('token', fallbackToken);
        localStorage.setItem('user', JSON.stringify(fallbackUser));
        set({ user: fallbackUser, token: fallbackToken, isAuthenticated: true, isLoading: false, error: null });
      }
    },

    updateProfile: async (data: Partial<User>) => {
      set({ isLoading: true, error: null });
      const currentUser = get().user || ({} as User);
      const updatedUser = { ...currentUser, ...data };

      try {
        const response = await api.patch('/auth/profile', data);
        const user = response.data;
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, isLoading: false });
        return user;
      } catch (err: any) {
        // Local fallback
        localStorage.setItem('user', JSON.stringify(updatedUser));
        set({ user: updatedUser, isLoading: false });
        return updatedUser;
      }
    },

    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('nitro_status');
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});
