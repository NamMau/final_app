// API Configuration
// Comment out the one you're not using and uncomment the one you want to use

// Use ngrok URL for the backend - this allows your Expo app to reach your backend through the internet
//export const API_URL = 'https://f00d-2001-ee0-8209-1109-28d5-8e30-9009-854d.ngrok-free.app/api';
export const API_URL = 'https://3367-2001-ee0-8209-1109-99-2f89-e0a2-59b8.ngrok-free.app/api';
//export const API_URL = 'http://172.18.208.1:4000/api';
//export const API_URL = 'http://192.168.11.242:4000/api';

// API Key
export const API_KEY = 'super_secret_password';

// Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
  maxRetries: 3,           // Maximum number of retry attempts
  initialDelayMs: 1000,    // Initial delay before first retry (1 second)
  maxDelayMs: 10000,       // Maximum delay between retries (10 seconds)
  backoffFactor: 2,        // Exponential backoff multiplier
  requestsPerMinute: 30,   // Target requests per minute to stay under rate limit
};

// Request Timeout Configuration
export const REQUEST_TIMEOUT_MS = 15000; // 15 seconds

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