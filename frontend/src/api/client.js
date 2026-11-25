import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('wh_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/verify-certificate')) {
        localStorage.removeItem('wh_token');
        localStorage.removeItem('wh_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
