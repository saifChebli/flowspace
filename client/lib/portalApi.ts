import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

const portalApi = axios.create({ baseURL, withCredentials: false });

// Attach portal session token on every request
portalApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('portalToken');
    if (token) {
      config.headers['X-Portal-Token'] = token;
    }
  }
  return config;
});

export default portalApi;
