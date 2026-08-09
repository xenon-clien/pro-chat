import { create } from 'zustand';
import api from '../lib/api';
import { useAuthStore } from './useAuthStore';

export type NitroTier = 'classic' | 'nitro' | null;

export interface NitroPlan {
  id: NitroTier;
  name: string;
  price: number;
  period: string;
  color: string;
  features: string[];
  boosts: number;
  uploadLimit: string;
  streamQuality: string;
  badge: string;
}

export interface NitroGift {
  code: string;
  tier: NitroTier;
  senderName: string;
  claimed: boolean;
  createdAt: string;
}

export const NITRO_PLANS: NitroPlan[] = [
  {
    id: 'classic',
    name: 'ProChat Nitro Classic',
    price: 4.99,
    period: 'month',
    color: '#38BDF8',
    badge: '⚡',
    features: [
      'Animated profile picture (GIF/Bottts)',
      'Custom profile banner color',
      'Nitro Classic badge on profile',
      'Extended message length (4000 chars)',
      'Higher quality file uploads (50MB)',
      'Custom animated emojis in any server',
      'Reduced slow mode delay',
      'HD 720p 60fps streaming',
    ],
    boosts: 0,
    uploadLimit: '50MB',
    streamQuality: '720p 60fps',
  },
  {
    id: 'nitro',
    name: 'ProChat Nitro Boost',
    price: 9.99,
    period: 'month',
    color: '#F472B6',
    badge: '🌟',
    features: [
      'Everything in Nitro Classic',
      '2 Free Server Boosts per month',
      'Custom Gradient & Image Profile Banner',
      'Animated server icon & server banner',
      '1080p 60fps Ultra HD Screen Sharing',
      'HD Video Camera (1080p Crystal Clear)',
      'Ultra-high file uploads (500MB)',
      'Soundboard Custom Audio (Unlimited)',
      'Special Golden Nitro Crown on Profile',
      'Early access to new features & games',
    ],
    boosts: 2,
    uploadLimit: '500MB',
    streamQuality: '1080p 60fps Target',
  },
];

interface NitroState {
  isNitro: boolean;
  nitroTier: NitroTier;
  nitroExpiresAt: string | null;
  boostCredits: number;
  bannerColor: string | null;
  bannerUrl: string | null;
  isLoading: boolean;
  giftsCreated: NitroGift[];

  purchaseNitro: (tier: NitroTier) => Promise<void>;
  cancelNitro: () => Promise<void>;
  boostServer: (serverId: string) => Promise<void>;
  createNitroGift: (tier: NitroTier) => NitroGift;
  claimNitroGift: (code: string) => boolean;
  updateBanner: (data: { bannerColor?: string; bannerUrl?: string }) => Promise<void>;
  loadNitroStatus: () => Promise<void>;
}

export const useNitroStore = create<NitroState>((set, get) => {
  // Load from localStorage
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem('nitro_status') || '{}'); } catch { return {}; }
  })();

  return {
    isNitro: saved.isNitro ?? true, // Active by default in demo
    nitroTier: saved.nitroTier ?? 'nitro',
    nitroExpiresAt: saved.nitroExpiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    boostCredits: saved.boostCredits ?? 2,
    bannerColor: saved.bannerColor ?? '#F472B6',
    bannerUrl: saved.bannerUrl ?? null,
    isLoading: false,
    giftsCreated: saved.giftsCreated ?? [],

    purchaseNitro: async (tier) => {
      set({ isLoading: true });
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const update = {
        isNitro: true,
        nitroTier: tier,
        nitroExpiresAt: expiresAt,
        boostCredits: tier === 'nitro' ? 2 : 0,
      };

      // Also update user profile in useAuthStore
      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.getState().updateProfile({
          isNitro: true,
          nitroTier: tier || 'nitro',
        });
      }

      localStorage.setItem('nitro_status', JSON.stringify({ ...get(), ...update }));
      set({ ...update, isLoading: false });

      try {
        await api.post('/auth/nitro/purchase', { tier });
      } catch (e) {
        // Handled locally
      }
    },

    cancelNitro: async () => {
      set({ isLoading: true });
      const update = { isNitro: false, nitroTier: null as NitroTier, nitroExpiresAt: null, boostCredits: 0 };
      
      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.getState().updateProfile({ isNitro: false, nitroTier: undefined });
      }

      localStorage.setItem('nitro_status', JSON.stringify({ ...get(), ...update }));
      set({ ...update, isLoading: false });

      try { await api.delete('/auth/nitro'); } catch {}
    },

    boostServer: async (serverId: string) => {
      const { boostCredits } = get();
      if (boostCredits <= 0) throw new Error('No boost credits remaining');
      const nextCredits = boostCredits - 1;
      const update = { boostCredits: nextCredits };
      localStorage.setItem('nitro_status', JSON.stringify({ ...get(), ...update }));
      set(update);

      try {
        await api.post(`/servers/${serverId}/boost`);
      } catch (err) {
        // Handled
      }
    },

    createNitroGift: (tier: NitroTier) => {
      const sender = useAuthStore.getState().user?.name || 'Pro Member';
      const code = `GIFT-NITRO-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const newGift: NitroGift = {
        code,
        tier: tier || 'nitro',
        senderName: sender,
        claimed: false,
        createdAt: new Date().toISOString(),
      };

      const updated = [newGift, ...get().giftsCreated];
      localStorage.setItem('nitro_status', JSON.stringify({ ...get(), giftsCreated: updated }));
      set({ giftsCreated: updated });
      return newGift;
    },

    claimNitroGift: (code: string) => {
      get().purchaseNitro('nitro');
      return true;
    },

    updateBanner: async (data) => {
      const update = {
        bannerColor: data.bannerColor ?? get().bannerColor,
        bannerUrl: data.bannerUrl ?? get().bannerUrl,
      };
      localStorage.setItem('nitro_status', JSON.stringify({ ...get(), ...update }));
      set(update);

      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.getState().updateProfile(data);
      }
    },

    loadNitroStatus: async () => {
      try {
        const res = await api.get('/auth/nitro/status');
        if (res.data) {
          localStorage.setItem('nitro_status', JSON.stringify(res.data));
          set(res.data);
        }
      } catch {}
    },
  };
});
