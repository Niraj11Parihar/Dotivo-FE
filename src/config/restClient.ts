import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://dotivo-be.onrender.com';
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Authentication token expired or invalid. Clearing token.');
      await AsyncStorage.removeItem('access_token');
      // In a full app, you would also trigger a navigation event to the Login screen here
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  register: async (data: any) => {
    const response = await api.post('/auth/register', data);
    if (response.data.access_token) {
      await AsyncStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },
  login: async (data: any) => {
    const response = await api.post('/auth/login', data);
    if (response.data.access_token) {
      await AsyncStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },
  logout: async () => {
    await AsyncStorage.removeItem('access_token');
  },
};

// User Services
export const userService = {
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  deleteAccount: async () => {
    const response = await api.delete('/users/me');
    return response.data;
  },
  exportData: async () => {
    const response = await api.get('/users/me/export');
    return response.data;
  },
};

// Goal Services
export const goalService = {
  getTemplates: async () => {
    const response = await api.get('/goals');
    return response.data;
  },
  createTemplate: async (data: any) => {
    const response = await api.post('/goals', data);
    return response.data;
  },
  deleteTemplate: async (id: string) => {
    const response = await api.delete(`/goals/${id}`);
    return response.data;
  },
  updateTemplate: async (id: string, data: any) => {
    const response = await api.put(`/goals/${id}`, data);
    return response.data;
  },
};

// Plan & Progress Services
export const planService = {
  getDailyPlan: async (date: string) => {
    const response = await api.get(`/daily-plan?date=${date}`);
    return response.data;
  },
  logProgress: async (data: {
    goalTemplateId: string;
    date: string;
    completedCount: number;
    source: string;
  }) => {
    const response = await api.post('/completions', data);
    return response.data;
  },
  getHistory: async (range: number = 30) => {
    const response = await api.get(`/history?range=${range}`);
    return response.data;
  },
  exportWallpaper: async () => {
    // This calls Phase 4 of your backend guide
    const response = await api.post('/wallpaper/export', {}, { responseType: 'blob' });
    return response.data;
  }
};

export const quoteService = {
  getActiveQuotes: async () => {
    // Falls back to empty object if fails
    try {
      const response = await api.get('/public/quotes');
      return response.data;
    } catch (e) {
      console.warn('Failed to fetch dynamic quotes', e);
      return {};
    }
  }
};

export default api;
