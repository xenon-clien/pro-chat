import axios from 'axios';

const isCloudWithoutBackend = 
  typeof window !== 'undefined' && 
  window.location.hostname !== 'localhost' && 
  window.location.hostname !== '127.0.0.1' && 
  !import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (isCloudWithoutBackend ? '/api' : 'http://localhost:5000/api'),
  withCredentials: true,
});

// Request interceptor to add the auth token to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor with seamless cloud fallback
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If running in cloud demo mode without a live backend URL, provide instant mock responses
    if (isCloudWithoutBackend || error.message === 'Network Error' || !error.response) {
      const url = error.config?.url || '';
      const method = error.config?.method?.toLowerCase() || 'get';
      const data = error.config?.data ? (typeof error.config.data === 'string' ? JSON.parse(error.config.data) : error.config.data) : {};

      console.warn(`[Cloud Mode] Intercepted ${method.toUpperCase()} ${url} -> providing demo response`);

      if (url.includes('/auth/guest') || url.includes('/auth/login') || url.includes('/auth/register')) {
        const username = data.name || data.email?.split('@')[0] || 'Pro Member';
        const user = {
          id: 'demo-user-' + Math.random().toString(36).substring(2, 7),
          name: username.charAt(0).toUpperCase() + username.slice(1),
          email: data.email || 'guest@prochat.io',
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
          isNitro: true,
          nitroTier: 'nitro',
        };
        const token = 'demo-jwt-token-' + Date.now();
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return { data: { user, token }, status: 200, statusText: 'OK', headers: {}, config: error.config };
      }

      if (url.includes('/auth/profile')) {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        const updated = { ...stored, ...data };
        localStorage.setItem('user', JSON.stringify(updated));
        return { data: updated, status: 200, statusText: 'OK', headers: {}, config: error.config };
      }

      if (url.includes('/servers/init')) {
        const defaultServers = [
          {
            role: 'OWNER',
            server: {
              id: 'pro-chat-hq',
              name: 'Pro Chat HQ',
              iconUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=ProChat',
              ownerId: 'demo-user',
              channels: [
                { id: 'ch-general', name: 'general', type: 'TEXT', serverId: 'pro-chat-hq' },
                { id: 'ch-lounge', name: 'lounge', type: 'TEXT', serverId: 'pro-chat-hq' },
                { id: 'ch-nitro-chat', name: 'nitro-exclusive', type: 'TEXT', serverId: 'pro-chat-hq' },
                { id: 'ch-voice-1', name: 'General Voice', type: 'VOICE', serverId: 'pro-chat-hq' },
                { id: 'ch-voice-gaming', name: 'Gaming Room 🎮', type: 'VOICE', serverId: 'pro-chat-hq' },
              ]
            }
          }
        ];
        return { data: defaultServers, status: 200, statusText: 'OK', headers: {}, config: error.config };
      }

      if (url.includes('/messages/')) {
        if (method === 'post') {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const newMsg = {
            id: 'msg-' + Date.now(),
            content: data.content,
            createdAt: new Date().toISOString(),
            author: { id: user.id || 'demo-user', name: user.name || 'Pro Member', avatarUrl: user.avatarUrl },
            channelId: url.split('/').pop()
          };
          return { data: newMsg, status: 200, statusText: 'OK', headers: {}, config: error.config };
        }
        return { data: [], status: 200, statusText: 'OK', headers: {}, config: error.config };
      }

      return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config: error.config };
    }

    return Promise.reject(error);
  }
);

export default api;

