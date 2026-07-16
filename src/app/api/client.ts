import axios from 'axios';
import { toast } from 'sonner';

const apiBaseUrl = import.meta.env.VITE_API_URL || '';

// Centralized Axios client
export const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept responses to automatically handle errors and display toaster alerts
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    
    let message = 'An unexpected error occurred';
    if (data?.message) {
      message = Array.isArray(data.message) ? data.message[0] : data.message;
    } else if (error.message) {
      message = error.message;
    }

    if (status === 401) {
      // Treat auth/me as a normal logged-out check instead of a hard failure
      if (error.config?.url?.endsWith('/auth/me')) {
        return Promise.resolve({ user: null });
      }

      // Don't toast for silent check-auth failures
      if (!error.config?.url?.endsWith('/auth/me')) {
        toast.error('Session expired. Please log in again.');
      }
    } else if (status === 403) {
      toast.error('Access Denied: You do not have permission to perform this action.');
    } else {
      toast.error(message);
    }

    return Promise.reject({
      status,
      message,
      data,
    });
  }
);
