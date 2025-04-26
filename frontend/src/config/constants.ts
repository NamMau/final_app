// export const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.7:4000/api';
// export const API_KEY = process.env.REACT_APP_API_KEY || 'super_secret_password';
//export const API_URL = 'http://192.168.1.8:4000/api';
//export const API_URL = 'http://192.168.0.105:4000/api';
export const API_URL = 'http://192.168.1.12:4000/api';
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
    GET_PROFILE: '/v1/users/profile',
    UPDATE_PROFILE: '/v1/users/update-profile',
    UPDATE_BALANCE: '/v1/users/update-balance'
  },
  ACCOUNTS: {
    CREATE_ACCOUNT: '/v1/accounts/create-account',
    GET_ALL_ACCOUNTS: '/v1/accounts/get-all-accounts',
    GET_BY_ID: (id: string) => `/v1/accounts/get-account-by-id/${id}`,
    UPDATE: (id: string) => `/v1/accounts/update-account/${id}`,
    DELETE: (id: string) => `/v1/accounts/delete-account/${id}`, 
    ADD_HISTORY: '/v1/accounts/add-history',
  },
  BILLS: {
    BASE: '/v1/bills',
    CREATE: '/v1/bills/create-bill',
    GET_ALL: '/v1/bills/getallbills',
    GET_BY_ID: (id: string) => `/v1/bills/get-bill/${id}`,
    UPDATE: (id: string) => `/v1/bills/update-bill/${id}`,
    DELETE: (id: string) => `/v1/bills/delete-bill/${id}`,
    DELETE_ALL: '/v1/bills/delete-bills',
    SCAN: '/v1/bills/scan',
    UPDATE_SCANNED: (id: string) => `/v1/bills/scan/${id}`,
    SUMMARY: '/v1/bills/summary',
    TRENDS: '/v1/bills/trends',
  },
  CATEGORIES: {
    CREATE: '/v1/categories/create-category',
    GET_ALL: '/v1/categories/get-all-categories',
    UPDATE: (id: string) => `/v1/categories/update-category-by-id/${id}`,
    DELETE: (id: string) => `/v1/categories/delete-category-by-id/${id}`,
  },
  BUDGETS: {
    CREATE: '/v1/budgets',
    GET_ALL: '/v1/budgets',
    GET_BY_ID: (id: string) => `/v1/budgets/${id}`,
    UPDATE: (id: string) => `/v1/budgets/${id}`,
    DELETE: (id: string) => `/v1/budgets/${id}`,
  },
  GOALS: {
    CREATE: '/v1/goals/create-goal',
    CREATE_FINANCIAL_GOAL: '/v1/goals/create-financial-goal',
    GET_ALL: '/v1/goals/get-user-goals/${userId}',
    GET_DETAILS: '/v1/goals/details/${goalId}',
    UPDATE_PROGRESS: '/v1/goals/update-progress/${goalId}',
    CHECK_MILESTONES: '/v1/goals/check-milestones/${goalId}',
    COMPLETE: (id: string) => `/v1/goals/complete-goal/${id}`,
    DELETE: (id: string) => `/v1/goals/delete-goal/${id}`,
  },
  LOANS: {
    CREATE: '/v1/loans/create-loan',
    CREATE_WITH_GOAL: '/v1/loans/create-with-goal',
    GENERATE_SCHEDULE: '/v1/loans/payment-schedule',
    GET_ALL: '/v1/loans/get-user-loans/${userID}',
    GET_DETAILS: '/v1/loans/get-loan-by-id/${loanID}',
    RECORD_PAYMENT: '/v1/loans/record-payment/${loanID}',
    GET_BY_ID: (id: string) => `/v1/loans/get-loan-by-id/${id}`,
    UPDATE: (id: string) => `/v1/loans/update-loan/${id}`,
    DELETE: (id: string) => `/v1/loans/delete-loan/${id}`,
  },
  TRANSACTIONS: {
    BASE: '/v1/transactions',
    GET_ALL: '/v1/transactions',
    CREATE: '/v1/transactions',
    STATS: '/v1/transactions/stats'
  },
  FINANCIAL_REPORTS: {
    BASE: '/v1/financial-reports',
    GENERATE: '/v1/financial-reports/generate'
  },
  NOTIFICATIONS: {
    CREATE: '/v1/notifications/create-notification',
    GET_USER: '/v1/notifications/get-user-notifications/${userID}',
    MARK_READ: (id: string) => `/v1/notifications/mark-as-read/${id}`,
    DELETE: (id: string) => `/v1/notifications/delete-notification/${id}`,
  },
}; 