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

function getStoredSession(): { user: User | null; token: string | null } {
  if (typeof window === 'undefined') return { user: null, token: null };

  // 1. Check tab-isolated sessionStorage first
  const sessToken = sessionStorage.getItem('token');
  const sessUser = sessionStorage.getItem('user');
  if (sessToken && sessUser) {
    try {
      return { user: JSON.parse(sessUser), token: sessToken };
    } catch (e) {}
  }

  // 2. Fallback to localStorage for single-tab sessions
  const localToken = localStorage.getItem('token');
  const localUser = localStorage.getItem('user');
  if (localToken && localUser) {
    try {
      const u = JSON.parse(localUser);
      // Clone into sessionStorage so this tab has independent session
      sessionStorage.setItem('token', localToken);
      sessionStorage.setItem('user', localUser);
      return { user: u, token: localToken };
    } catch (e) {}
  }

  return { user: null, token: null };
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initial = getStoredSession();

  return {
    user: initial.user,
    token: initial.token,
    isAuthenticated: !!initial.token,
    isLoading: false,
    error: null,
    
    setAuth: (user, token) => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      set({ user, token, isAuthenticated: true });
    },

    guestLogin: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post('/auth/guest');
        const u = response.data.user;
        const t = response.data.token;
        sessionStorage.setItem('token', t);
        sessionStorage.setItem('user', JSON.stringify(u));
        set({ user: u, token: t, isAuthenticated: true, isLoading: false });
      } catch (err: any) {
        const fallbackUser: User = {
          id: 'guest-' + Math.random().toString(36).substring(2, 8),
          email: 'guest@prochat.io',
          name: 'Pro Guest',
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ProGuest&backgroundColor=fbbf24',
          isNitro: true,
          nitroTier: 'nitro',
        };
        const fallbackToken = 'demo-token-' + Date.now();
        sessionStorage.setItem('token', fallbackToken);
        sessionStorage.setItem('user', JSON.stringify(fallbackUser));
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
        sessionStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, isLoading: false });
        return user;
      } catch (err: any) {
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('user', JSON.stringify(updatedUser));
        set({ user: updatedUser, isLoading: false });
        return updatedUser;
      }
    },

    logout: () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('nitro_status');
        localStorage.removeItem('prochat_user_servers');
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('prochat_msgs_')) localStorage.removeItem(key);
        });
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith('prochat_msgs_')) sessionStorage.removeItem(key);
        });
      }
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});
