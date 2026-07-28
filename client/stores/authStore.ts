import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  isPlatformAdmin?: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null; // in-memory only — never persisted
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setToken: (accessToken: string) => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        get().setToken(data.accessToken);
        await get().fetchMe();
      },

      logout: () => {
        // Refresh token lives in an httpOnly cookie; the server clears it.
        api.post('/auth/logout').catch(() => {});
        disconnectSocket();
        set({ user: null, accessToken: null, isAuthenticated: false });
        // Clean up any legacy localStorage tokens from the pre-cookie era.
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      },

      setToken: (accessToken) => {
        connectSocket(accessToken);
        set({ accessToken, isAuthenticated: true });
      },

      fetchMe: async () => {
        const { data } = await api.get('/auth/me');
        set({ user: data, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-store',
      // Persist only non-sensitive session hints. The access token stays in
      // memory; on reload it is re-minted from the httpOnly refresh cookie.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
