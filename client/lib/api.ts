import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send the httpOnly refresh cookie to /auth routes
});

// Attach the in-memory access token on every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single shared refresh so concurrent 401s don't each rotate the cookie (which
// would invalidate the others). Resolves to the new access token, or null.
let refreshPromise: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
      .then(({ data }) => {
        useAuthStore.getState().setToken(data.accessToken);
        return data.accessToken as string;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// Auto-refresh on 401 via the refresh cookie
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      useAuthStore.getState().logout();
      toast.error('Your session has expired. Please sign in again.');
      if (typeof window !== 'undefined') window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default api;
