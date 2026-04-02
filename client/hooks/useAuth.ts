'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { connectSocket } from '@/lib/socket';

export function useAuth() {
  const store = useAuthStore();
  return store;
}

export function useRequireAuth() {
  const { isAuthenticated, accessToken, fetchMe, user } = useAuthStore();

  useEffect(() => {
    if (accessToken && !user) {
      fetchMe().catch(() => {});
    }
    if (accessToken) {
      connectSocket(accessToken);
    }
  }, [accessToken, user, fetchMe]);

  return { isAuthenticated, user };
}
