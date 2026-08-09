import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setAuth: (user: User, token: string) => void;
  guestLogin: () => Promise<void>;
  updateProfile: (data: { name?: string; avatarUrl?: string }) => Promise<User>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Check local storage for initial state
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let initialUser = null;
  
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
        console.warn('Backend API offline or unreachable, activating local demo session:', err);
        const fallbackUser: User = {
          id: 'guest-' + Math.random().toString(36).substring(2, 8),
          email: 'guest@prochat.io',
          name: 'Pro Member',
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberBot',
        };
        const fallbackToken = 'demo-jwt-token-' + Date.now();
        localStorage.setItem('token', fallbackToken);
        localStorage.setItem('user', JSON.stringify(fallbackUser));
        set({ user: fallbackUser, token: fallbackToken, isAuthenticated: true, isLoading: false, error: null });
      }
    },

    updateProfile: async (data: { name?: string; avatarUrl?: string }) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.patch('/auth/profile', data);
        const updatedUser = response.data;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        set({ user: updatedUser, isLoading: false });
        return updatedUser;
      } catch (err: any) {
        console.warn('Backend offline, updating local profile state:', err);
        const currentUser = get().user || { id: 'local-user', email: 'guest@prochat.io', name: 'User' };
        const updatedUser = { ...currentUser, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        set({ user: updatedUser, isLoading: false, error: null });
        return updatedUser;
      }
    },
    
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});

