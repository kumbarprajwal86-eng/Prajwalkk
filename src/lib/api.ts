import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('viewpoint_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't clear token if optional auth failed, only if explicit auth failed
      if (error.config?.url && !error.config.url.includes('/videos') && !error.config.url.includes('/comments')) {
        localStorage.removeItem('viewpoint_token');
      }
    }
    return Promise.reject(error);
  }
);
