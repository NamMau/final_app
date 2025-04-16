// export const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.7:4000/api';
// export const API_KEY = process.env.REACT_APP_API_KEY || 'super_secret_password';
export const API_URL = 'http://192.168.1.9:4000/api';
export const API_KEY = 'super_secret_password';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/v1/auth/login',
    REGISTER: '/v1/auth/register',
    REFRESH_TOKEN: '/v1/auth/refresh-token',
  },
  USER: {
    CREATE: '/v1/users/create-user',
    GET_ALL: '/v1/users/get-all-users',
    GET_BY_ID: (id: string) => `/v1/users/get-user-by-id/${id}`,
    UPDATE: (id: string) => `/v1/users/update-user-by-id/${id}`,
    CHANGE_PASSWORD: '/v1/users/change-password',
    DELETE: (id: string) => `/v1/users/delete-user-by-id/${id}`,
  },
  BILLS: {
    CREATE: '/v1/bills/create-bill',
    GET_ALL: '/v1/bills/get-all-bills',
    GET_BY_ID: (id: string) => `/v1/bills/get-bill-by-id/${id}`,
    UPDATE: (id: string) => `/v1/bills/update-bill-by-id/${id}`,
    DELETE: (id: string) => `/v1/bills/delete-bill/${id}`,
    DELETE_ALL: '/v1/bills/delete-bills',
    SCAN: '/v1/bills/scan',
    UPDATE_SCANNED: (id: string) => `/v1/bills/scan/${id}`,
  },
  CATEGORIES: {
    CREATE: '/v1/categories/create-category',
    GET_ALL: '/v1/categories/get-all-categories',
    UPDATE: (id: string) => `/v1/categories/update-category-by-id/${id}`,
    DELETE: (id: string) => `/v1/categories/delete-category-by-id/${id}`,
  },
  BUDGETS: {
    CREATE: '/v1/budgets/create-budget',
    GET_ALL: '/v1/budgets/get-all-budgets',
    GET_BY_ID: (id: string) => `/v1/budgets/get-budget-by-id/${id}`,
    UPDATE: (id: string) => `/v1/budgets/update-budget-by-id/${id}`,
    DELETE: (id: string) => `/v1/budgets/delete-budget-by-id/${id}`,
  },
  GOALS: {
    CREATE: '/v1/goals/create-goal',
    GET_ALL: '/v1/goals/get-user-goals/${userId}',
    COMPLETE: (id: string) => `/v1/goals/complete-goal/${id}`,
    DELETE: (id: string) => `/v1/goals/delete-goal/${id}`,
  },
  LOANS: {
    CREATE: '/v1/loans/create-loan',
    GET_ALL: '/v1/loans/get-user-loans/${userID}',
    GET_BY_ID: (id: string) => `/v1/loans/get-loan-by-id/${id}`,
    DELETE: (id: string) => `/v1/loans/delete-loan/${id}`,
  },
  NOTIFICATIONS: {
    CREATE: '/v1/notifications/create-notification',
    GET_USER: '/v1/notifications/get-user-notifications/${userID}',
    MARK_READ: (id: string) => `/v1/notifications/mark-as-read/${id}`,
    DELETE: (id: string) => `/v1/notifications/delete-notification/${id}`,
  },
}; 