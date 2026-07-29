import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import api from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

/** Shared in-flight session restore, so concurrent callers don't double-refresh. */
let bootstrapPromise: Promise<void> | null = null;

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
  bootstrapped: boolean; // has the startup session-restore finished?

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setToken: (accessToken: string) => void;
  fetchMe: () => Promise<void>;
  bootstrap: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      bootstrapped: false,

      /**
       * Restore a persisted session on page load. The access token is memory-only,
       * so after any reload it is gone while `isAuthenticated` is still persisted —
       * without this, the first API call fires with no token, 401s, and can log the
       * user out. Exchanges the httpOnly refresh cookie for a fresh access token.
       */
      bootstrap: () => {
        if (get().bootstrapped) return Promise.resolve();

        // Nothing persisted to restore — nothing to do.
        if (!get().isAuthenticated) {
          set({ bootstrapped: true });
          return Promise.resolve();
        }

        // Share one in-flight attempt. Refreshing rotates the token server-side,
        // so two concurrent calls (React StrictMode double-invokes effects) would
        // make the second fail against an already-deleted token and wipe the session.
        if (!bootstrapPromise) {
          bootstrapPromise = (async () => {
            try {
              const { data } = await axios.post(
                `${API_URL}/auth/refresh`,
                {},
                { withCredentials: true },
              );
              get().setToken(data.accessToken);
              await get().fetchMe();
            } catch {
              // Session can't be restored — clear it quietly. No toast, no redirect:
              // route guards send the user to login.
              disconnectSocket();
              set({ user: null, accessToken: null, isAuthenticated: false });
            } finally {
              set({ bootstrapped: true });
              bootstrapPromise = null;
            }
          })();
        }
        return bootstrapPromise;
      },

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
