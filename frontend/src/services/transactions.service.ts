import { apiService } from './api';
import { ENDPOINTS } from '../config/constants';

export interface Transaction {
  _id: string;
  user: string;
  bill: {
    _id: string;
    billName: string;
  };
  amount: number;
  type: 'bill_payment';
  category: {
    _id: string;
    categoryName: string;
    color: string;
  };
  description: string;
  date: string;
  balanceAfter: number;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionStats {
  date: string;
  category: string;
  categoryColor: string;
  total: number;
}

export const transactionsService = {
  async getTransactions(params?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    type?: string;
  }): Promise<Transaction[]> {
    try {
      const queryParams = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
      const url = `${ENDPOINTS.TRANSACTIONS.GET_ALL}${queryParams ? `?${queryParams}` : ''}`;
      console.log('Fetching transactions from URL:', url);
      
      const response = await apiService.get<Transaction[]>(url);
      console.log('Raw API response:', response?.data);
      
      // Check if response has data
      if (!response?.data) {
        console.error('No response data received');
        return [];
      }

      // Ensure data is an array
      const transactions = response.data;
      if (!Array.isArray(transactions)) {
        console.error('Response is not an array:', transactions);
        return [];
      }

      console.log('Parsed transactions:', transactions);
      return transactions;
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  },

  async getTransactionStats(period: 'week' | 'month' | 'year' = 'month'): Promise<TransactionStats[]> {
    try {
      const url = `${ENDPOINTS.TRANSACTIONS.STATS}?period=${period}`;
      console.log('Fetching transaction stats from URL:', url);
      
      const response = await apiService.get<TransactionStats[]>(url);
      console.log('Raw stats API response:', response?.data);
      
      if (!response?.data) {
        console.error('No stats data received');
        return [];
      }
      
      if (!Array.isArray(response.data)) {
        console.error('Stats response is not an array:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error('Error getting transaction stats:', error);
      return [];
    }
  }
};
