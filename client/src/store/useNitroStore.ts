import { create } from 'zustand';
import api from '../lib/api';

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

export const NITRO_PLANS: NitroPlan[] = [
  {
    id: 'classic',
    name: 'ProChat Nitro Classic',
    price: 4.99,
    period: 'month',
    color: '#A855F7',
    badge: '⚡',
    features: [
      'Animated profile picture (GIF)',
      'Custom profile banner color',
      'Nitro Classic badge on profile',
      'Extended message length (2000 → 4000 chars)',
      'Higher quality file uploads (50MB)',
      'Custom emoji in any server',
      'Reduced slow mode',
      'HD avatar support',
    ],
    boosts: 0,
    uploadLimit: '50MB',
    streamQuality: '720p 30fps',
  },
  {
    id: 'nitro',
    name: 'ProChat Nitro',
    price: 9.99,
    period: 'month',
    color: '#FACC15',
    badge: '🌟',
    features: [
      'Everything in Nitro Classic',
      '2 Server Boosts per month',
      'Custom profile banner image',
      'Animated server icon support',
      '1080p 60fps screen sharing',
      'HD video camera (1080p)',
      'Ultra-high file uploads (500MB)',
      'Custom soundboard sounds (unlimited)',
      'Exclusive Nitro badge & profile effects',
      'Early access to new features',
    ],
    boosts: 2,
    uploadLimit: '500MB',
    streamQuality: '1080p 60fps',
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

  purchaseNitro: (tier: NitroTier) => Promise<void>;
  cancelNitro: () => Promise<void>;
  boostServer: (serverId: string) => Promise<void>;
  updateBanner: (data: { bannerColor?: string; bannerUrl?: string }) => Promise<void>;
  loadNitroStatus: () => Promise<void>;
}

export const useNitroStore = create<NitroState>((set, get) => {
  // Load from localStorage
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem('nitro_status') || '{}'); } catch { return {}; }
  })();

  return {
    isNitro: saved.isNitro ?? false,
    nitroTier: saved.nitroTier ?? null,
    nitroExpiresAt: saved.nitroExpiresAt ?? null,
    boostCredits: saved.boostCredits ?? 0,
    bannerColor: saved.bannerColor ?? null,
    bannerUrl: saved.bannerUrl ?? null,
    isLoading: false,

    purchaseNitro: async (tier) => {
      set({ isLoading: true });
      try {
        const res = await api.post('/auth/nitro/purchase', { tier });
        const data = res.data;
        const update = {
          isNitro: true,
          nitroTier: tier,
          nitroExpiresAt: data.nitroExpiresAt,
          boostCredits: tier === 'nitro' ? 2 : 0,
        };
        localStorage.setItem('nitro_status', JSON.stringify({ ...get(), ...update }));
        set({ ...update, isLoading: false });
      } catch {
        // Demo mode — activate locally if API fails
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const update = {
          isNitro: true,
          nitroTier: tier,
          nitroExpiresAt: expiresAt,
          boostCredits: tier === 'nitro' ? 2 : 0,
        };
        localStorage.setItem('nitro_status', JSON.stringify({ ...get(), ...update }));
        set({ ...update, isLoading: false });
      }
    },

    cancelNitro: async () => {
      set({ isLoading: true });
      try { await api.delete('/auth/nitro'); } catch {}
      const update = { isNitro: false, nitroTier: null as NitroTier, nitroExpiresAt: null, boostCredits: 0 };
      localStorage.setItem('nitro_status', JSON.stringify({ ...get(), ...update }));
      set({ ...update, isLoading: false });
    },

    boostServer: async (serverId: string) => {
      const { boostCredits } = get();
      if (boostCredits <= 0) throw new Error('No boost credits');
      try {
        await api.post(`/servers/${serverId}/boost`);
        const update = { boostCredits: boostCredits - 1 };
        localStorage.setItem('nitro_status', JSON.stringify({ ...get(), ...update }));
        set(update);
      } catch (err: any) {
        throw err;
      }
    },

    updateBanner: async (data) => {
      try {
        await api.patch('/auth/profile', data);
      } catch {}
      const update = {
        bannerColor: data.bannerColor ?? get().bannerColor,
        bannerUrl: data.bannerUrl ?? get().bannerUrl,
      };
      localStorage.setItem('nitro_status', JSON.stringify({ ...get(), ...update }));
      set(update);
    },

    loadNitroStatus: async () => {
      try {
        const res = await api.get('/auth/nitro/status');
        const data = res.data;
        localStorage.setItem('nitro_status', JSON.stringify(data));
        set(data);
      } catch {}
    },
  };
});
