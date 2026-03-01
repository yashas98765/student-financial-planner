import axios from 'axios';

const API_BASE = 'http://localhost:5001/api';

// Add request interceptor to ensure token is included
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle 401 errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear authentication data on 401 error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const expensesAPI = {
  getExpenses: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await axios.get(`${API_BASE}/expenses${queryString ? `?${queryString}` : ''}`);
    console.log('API Response:', response.data);
    return response.data; // This returns { expenses: [...], pagination: {...} }
  },
  createExpense: (data) => axios.post(`${API_BASE}/expenses`, data),
  updateExpense: (id, data) => axios.put(`${API_BASE}/expenses/${id}`, data),
  deleteExpense: (id) => axios.delete(`${API_BASE}/expenses/${id}`),
  getExpenseStats: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`${API_BASE}/expenses/stats${queryString ? `?${queryString}` : ''}`);
  },
};

export const goalsAPI = {
  getGoals: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await axios.get(`${API_BASE}/goals${queryString ? `?${queryString}` : ''}`);
    console.log('Goals API Response:', response.data);
    return response.data; // This returns { goals: [...], summary: {...} }
  },
  createGoal: (data) => axios.post(`${API_BASE}/goals`, data),
  updateGoal: (id, data) => axios.put(`${API_BASE}/goals/${id}`, data),
  deleteGoal: (id) => axios.delete(`${API_BASE}/goals/${id}`),
  updateProgress: (id, data) => axios.patch(`${API_BASE}/goals/${id}/progress`, data),
  completeGoal: (id) => axios.patch(`${API_BASE}/goals/${id}/complete`),
};

export const reportsAPI = {
  getReports: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await axios.get(`${API_BASE}/reports${queryString ? `?${queryString}` : ''}`);
    return {
      data: response.data || {}
    };
  },
  exportPDF: async (params = {}) => {
    const response = await axios.post(`${API_BASE}/reports/export/pdf`, params, {
      responseType: 'blob'
    });
    return response;
  },
  exportExcel: async (params = {}) => {
    const response = await axios.post(`${API_BASE}/reports/export/excel`, params, {
      responseType: 'blob'
    });
    return response;
  },
  exportReport: (type, params = {}) => {
    return axios.post(`${API_BASE}/reports/export`, { type, ...params }, {
      responseType: 'blob'
    });
  },
};

export const authAPI = {
  login: (data) => axios.post(`${API_BASE}/auth/login`, data),
  register: (data) => axios.post(`${API_BASE}/auth/register`, data),
  logout: () => axios.post(`${API_BASE}/auth/logout`),
  getProfile: () => axios.get(`${API_BASE}/auth/profile`),
  updateProfile: (data) => axios.put(`${API_BASE}/auth/profile`, data),
};

// Utility functions
export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

export const getCategoryIcon = (category) => {
  const emojiMap = {
    'food': '🍽️',
    'groceries': '🛒',
    'transportation': '🚗',
    'entertainment': '🎬',
    'shopping': '🛍️',
    'utilities': '⚡',
    'healthcare': '🏥',
    'education': '📚',
    'travel': '✈️',
    'fitness': '💪',
    'subscription': '📱',
    'rent': '🏠',
    'insurance': '🛡️',
    'gas': '⛽',
    'dining': '🍽️',
    'coffee': '☕',
    'bills': '📄',
    'personal': '👤',
    'other': '💳'
  };
  
  const lowerCategory = category?.toLowerCase() || '';
  
  if (emojiMap[lowerCategory]) {
    return emojiMap[lowerCategory];
  }
  
  // Try partial matches for common variations
  if (lowerCategory.includes('food') || lowerCategory.includes('restaurant')) return '🍽️';
  if (lowerCategory.includes('grocery') || lowerCategory.includes('market')) return '🛒';
  if (lowerCategory.includes('transport') || lowerCategory.includes('uber') || lowerCategory.includes('taxi')) return '🚗';
  if (lowerCategory.includes('movie') || lowerCategory.includes('entertainment') || lowerCategory.includes('game')) return '🎬';
  if (lowerCategory.includes('shop') || lowerCategory.includes('clothing') || lowerCategory.includes('store')) return '🛍️';
  if (lowerCategory.includes('electric') || lowerCategory.includes('utility') || lowerCategory.includes('water')) return '⚡';
  if (lowerCategory.includes('health') || lowerCategory.includes('medical') || lowerCategory.includes('doctor')) return '🏥';
  if (lowerCategory.includes('education') || lowerCategory.includes('school') || lowerCategory.includes('book')) return '📚';
  if (lowerCategory.includes('travel') || lowerCategory.includes('flight') || lowerCategory.includes('hotel')) return '✈️';
  if (lowerCategory.includes('gym') || lowerCategory.includes('fitness') || lowerCategory.includes('sport')) return '💪';
  if (lowerCategory.includes('subscription') || lowerCategory.includes('netflix') || lowerCategory.includes('spotify')) return '📱';
  if (lowerCategory.includes('rent') || lowerCategory.includes('mortgage') || lowerCategory.includes('housing')) return '🏠';
  if (lowerCategory.includes('insurance')) return '🛡️';
  if (lowerCategory.includes('gas') || lowerCategory.includes('fuel')) return '⛽';
  if (lowerCategory.includes('coffee') || lowerCategory.includes('café')) return '☕';
  if (lowerCategory.includes('bill') || lowerCategory.includes('payment')) return '📄';
  
  return '💳';
};
