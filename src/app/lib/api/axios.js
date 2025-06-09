import axios from 'axios';
import { setTokens, removeTokens } from '../auth/actions';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('adminAccessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;

       const refreshToken = localStorage.getItem('adminRefreshToken');
      if (!refreshToken) {
        removeTokens();
        window.location.href = '/admin/login';
        return Promise.reject(error);
      }

      try {
        // Call your EXISTING backend endpoint
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/refreshAccessToken`,
          {refreshToken : localStorage.getItem('adminRefreshToken')} 
        );
        removeTokens();
        const data = res.data.data;
        setTokens(data.accessToken,data.refreshToken);
        error.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(error.config);
      } catch (err) {
        removeTokens();
        console.log(err)
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;