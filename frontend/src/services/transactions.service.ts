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

export interface MonthlyStats {
  date: string;
  income: number;
  expenses: number;
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
      
      const response = await apiService.get<{success: boolean, data: Transaction[]}>(url);
      console.log('Raw API response:', response);
      
      // Check if response has data
      if (!response?.success || !response?.data) {
        console.error('No response data received or unsuccessful response');
        return [];
      }

      // The backend returns { success: true, data: [...transactions] }
      // Extract the data array from the response
      const transactions = response.data;
      if (!Array.isArray(transactions)) {
        console.error('Response data is not an array:', transactions);
        return [];
      }

      console.log('Parsed transactions:', transactions);
      console.log('Number of transactions:', transactions.length);
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
      
      const response = await apiService.get<{success: boolean, data: TransactionStats[]}>(url);
      console.log('Raw stats API response:', response);
      
      if (!response?.success || !response?.data) {
        console.error('No stats data received or unsuccessful response');
        return [];
      }
      
      // The backend returns { success: true, data: [...stats] }
      const stats = response.data;
      if (!Array.isArray(stats)) {
        console.error('Stats response data is not an array:', stats);
        return [];
      }
      
      console.log('Number of stat entries:', stats.length);
      return stats;
    } catch (error) {
      console.error('Error getting transaction stats:', error);
      return [];
    }
  },

  // Get monthly income and expense stats
  async getMonthlyStats(period: 'week' | 'month' | 'year' = 'month'): Promise<MonthlyStats[]> {
    try {
      const url = `${ENDPOINTS.TRANSACTIONS.STATS}/monthly?period=${period}`;
      console.log('Fetching monthly stats from URL:', url);
      
      const response = await apiService.get<{success: boolean, data: MonthlyStats[]}>(`${ENDPOINTS.TRANSACTIONS.STATS}/monthly?period=${period}`);
      console.log('Raw monthly stats response:', response);
      
      if (!response?.success || !response?.data) {
        console.error('No monthly stats data received or unsuccessful response');
        return [];
      }
      
      // The backend returns { success: true, data: [...stats] }
      const stats = response.data;
      if (!Array.isArray(stats)) {
        console.error('Monthly stats response data is not an array:', stats);
        return [];
      }
      
      console.log('Number of monthly stat entries:', stats.length);
      return stats;
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      
      // Return mock data for demo purposes
      const mockData: MonthlyStats[] = [];
      const today = new Date();
      
      // Generate last 7 days, 30 days, or 12 months based on period
      const daysToGenerate = period === 'week' ? 7 : period === 'month' ? 30 : 12;
      
      for (let i = 0; i < daysToGenerate; i++) {
        const date = new Date();
        if (period === 'year') {
          // For year, go back by months
          date.setMonth(today.getMonth() - i);
        } else {
          // For week/month, go back by days
          date.setDate(today.getDate() - i);
        }
        
        mockData.push({
          date: date.toISOString(),
          income: Math.floor(Math.random() * 5000000) + 5000000, // Random income between 5-10M
          expenses: Math.floor(Math.random() * 3000000) + 2000000 // Random expenses between 2-5M
        });
      }
      
      return mockData.reverse(); // Return in chronological order
    }
  }
};
