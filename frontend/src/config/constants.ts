export const API_URL = 'http://192.168.1.15:4000/api';
export const API_KEY = 'super_secret_password';

export const ENDPOINTS = {
  AUTH: {
    // LOGIN: '/api/auth/login',
    // REGISTER: '/api/auth/register',
    LOGIN: '/auth/login', // Sửa lại thành '/auth/login'
    REGISTER: '/auth/register', // Sửa lại thành '/auth/register'
  },
  USER: {
    PROFILE: '/api/user/profile',
    UPDATE: '/api/user/update',
  },
  BILLS: {
    LIST: '/api/bills',
    CREATE: '/api/bills',
    UPDATE: (id: string) => `/api/bills/${id}`,
    DELETE: (id: string) => `/api/bills/${id}`,
    SCAN: '/api/bills/scan',
  },
  CATEGORIES: {
    LIST: '/api/categories',
    CREATE: '/api/categories',
    UPDATE: (id: string) => `/api/categories/${id}`,
    DELETE: (id: string) => `/api/categories/${id}`,
  },
  BUDGETS: {
    LIST: '/api/budgets',
    CREATE: '/api/budgets',
    UPDATE: (id: string) => `/api/budgets/${id}`,
    DELETE: (id: string) => `/api/budgets/${id}`,
  },
  GOALS: {
    LIST: '/api/goals',
    CREATE: '/api/goals',
    UPDATE: (id: string) => `/api/goals/${id}`,
    DELETE: (id: string) => `/api/goals/${id}`,
  },
}; 