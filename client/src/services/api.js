import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://dev-tracker-server.vercel.app/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// On 401, redirect to login (session expired or revoked)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const code = error.response?.data?.code;
      // Don't redirect on the /auth/me call itself (used to detect auth state)
      if (code !== 'UNAUTHENTICATED' || !window.location.pathname.includes('/dashboard')) {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  me: () => api.get('/auth/me').then((r) => r.data.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  loginUrl: () => `${BASE_URL}/auth/github`,
};

export const reposApi = {
  available: () => api.get('/repos/available').then((r) => r.data.data),
  connect: (githubRepoId) =>
    api.post('/repos', { githubRepoId }).then((r) => r.data.data),
  disconnect: () => api.delete('/repos').then((r) => r.data),
};

export const statsApi = {
  commits: (from, to) => {
    const params = {};
    if (from) params.from = from instanceof Date ? from.toISOString() : from;
    if (to) params.to = to instanceof Date ? to.toISOString() : to;
    return api.get('/stats/commits', { params }).then((r) => r.data.data);
  },
  demo: (from, to) => {
    const params = {};
    if (from) params.from = from instanceof Date ? from.toISOString() : from;
    if (to) params.to = to instanceof Date ? to.toISOString() : to;
    return api.get('/stats/demo', { params }).then((r) => r.data.data);
  },
};

export default api;
