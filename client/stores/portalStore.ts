import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PortalSession } from '@/types';

interface PortalState {
  session: PortalSession | null;
  isAuthenticated: boolean;

  setSession: (session: PortalSession) => void;
  logout: () => void;
}

export const usePortalStore = create<PortalState>()(
  persist(
    (set) => ({
      session: null,
      isAuthenticated: false,

      setSession: (session) => {
        localStorage.setItem('portalToken', session.sessionToken);
        set({ session, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('portalToken');
        set({ session: null, isAuthenticated: false });
      },
    }),
    {
      name: 'portal-store',
      partialize: (state) => ({
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
