import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// URL base da API (pode vir de variável de ambiente)
// Em produção (Docker), o frontend é servido pela mesma origem da API
export const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Se estiver rodando no browser
    // Se for desenvolvimento local (Next.js rodando separado do Go)
    if (window.location.port === '3000' || window.location.port === '3003' || window.location.port === '3005') {
      return '/api/v1';
    }
    // Se for produção (Next.js exportado e servido pelo Go)
    return window.location.origin + '/api/v1';
  }
  
  // Server-side (SSR/SSG)
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4120') + '/api/v1';
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

api.interceptors.request.use(
  (config) => {
    // Try to get token from auth store
    const state = useAuthStore.getState();
    let token = state.session?.access_token;

    // If no token in session, try to get from localStorage (fallback for local backend auth)
    if (!token) {
      try {
        const localToken = localStorage.getItem('sb-mensager-auth-token');
        if (localToken) {
          const parsed = JSON.parse(localToken);
          token = parsed.access_token || parsed.token;
        }
      } catch (e) {
        console.warn('Could not parse local auth token:', e);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth state and redirect to login
      useAuthStore.getState().logout();
      // Use router instead of direct window.location for better Next.js integration
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;