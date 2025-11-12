import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('charityguard-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API calls
export const authAPI = {
  googleLogin: async (googleToken: string) => {
    const response = await api.post('/auth/google', { token: googleToken });
    return response.data;
  },
  
  verifyToken: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

// Charity API calls
export const charityAPI = {
  searchCharities: async (query: string, page: number = 1, limit: number = 20) => {
    const response = await api.get('/nonprofits', {
      params: { search: query, page, limit }
    });
    return response.data;
  },
  
  getCharityById: async (id: string) => {
    const response = await api.get(`/nonprofits/${id}`);
    return response.data;
  },
};

// Payment API calls
export const paymentAPI = {
  createPaymentIntent: async (amount: number, charityId: string) => {
    const response = await api.post('/payments/create-intent', {
      amount,
      charityId,
    });
    return response.data;
  },
  
  confirmPayment: async (paymentIntentId: string) => {
    const response = await api.post('/payments/confirm', {
      paymentIntentId,
    });
    return response.data;
  },
};