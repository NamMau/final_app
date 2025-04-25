import {apiService}  from './api';
import { ENDPOINTS } from '../config/constants';

export interface BillItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Category {
  _id: string;
  name: string;
  type: 'expense' | 'income';
  color?: string;
  icon?: string;
}

export interface Budget {
  _id: string;
  name: string;
  amount: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  alertThreshold: number;
  isActive: boolean;
  categoryID: Category;
}

export interface Bill {
  _id: string;
  user?: string;  
  billName: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'overdue';
  type: 'manual' | 'ocr';
  budget: Budget;
  description?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface BillResponse {
  success: boolean;
  message?: string;
  bill?: Bill;
  budgetDetails?: {
    billAmount: number;
    currentSpent: number;
    newTotal: number;
    budgetAmount: number;
    threshold: number;
    percentage: number;
  };
  error?: {
    type: string;
    details: any;
  };
}

export interface ExpenseSummary {
  total: number;
  byCategory: { [categoryId: string]: number };
  byDate: { [date: string]: number };
  byType: { [type: string]: number };
}

export interface ExpenseTrends {
  daily: { [date: string]: number };
  weekly: { [week: string]: number };
  monthly: { [month: string]: number };
}

export interface ScanBillResponse {
  success: boolean;
  data: {
    bill: Bill;
  };
}

export const billsService = {
  // Scan bill image
  async scanBill(imageBase64: string): Promise<ScanBillResponse> {
    try {
      const response = await apiService.post<ScanBillResponse>(ENDPOINTS.BILLS.SCAN, {
        imageBase64
      });
      if (!response.data) {
        throw new Error('No data received from scan bill request');
      }
      return response.data;
    } catch (error) {
      console.error('Error scanning bill:', error);
      throw error;
    }
  },

  // Update scanned bill
  async updateScannedBill(billId: string, updates: Partial<Bill>): Promise<ScanBillResponse> {
    try {
      const response = await apiService.put<ScanBillResponse>(`${ENDPOINTS.BILLS.BASE}/scan/${billId}`, updates);
      if (!response.data) {
        throw new Error('No data received from update scanned bill request');
      }
      return response.data;
    } catch (error) {
      console.error('Error updating scanned bill:', error);
      throw error;
    }
  },

  // Get all bills
  async getBills(params?: {
    status?: string;
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Bill[]> {
    try {
      console.log('Calling getBills API...');
      const response = await apiService.get<Bill[]>(ENDPOINTS.BILLS.GET_ALL);
      console.log('Raw API response:', response);
      
      if (!response.data) {
        console.log('No response.data');
        return [];
      }
      
      const bills = response.data;
      console.log('API response data:', bills);
      
      if (!Array.isArray(bills)) {
        console.log('Response is not an array');
        return [];
      }
      
      console.log('Parsed bills:', bills);
      return bills;
    } catch (error) {
      console.error('Error getting bills:', error);
      throw error;
    }
  },

  // Get bill by ID
  async getBillById(id: string): Promise<Bill> {
    try {
      const response = await apiService.get<Bill>(`${ENDPOINTS.BILLS.BASE}/${id}`);
      if (!response.data) {
        throw new Error('Bill not found');
      }
      return response.data;
    } catch (error) {
      console.error('Error getting bill:', error);
      throw error;
    }
  },

  // Create new bill
  async createBill(data: {
    billName: string;
    amount: number;
    dueDate: string;
    budget: string;
    description?: string;
    type?: 'manual' | 'ocr';
    location?: string;
    forceCreate?: boolean;
  }): Promise<BillResponse> {
    try {
      const response = await apiService.post<Bill>(ENDPOINTS.BILLS.CREATE, data);
      if (!response.data) {
        throw new Error('Failed to create bill');
      }
      return {
        success: true,
        bill: response.data
      };
    } catch (error: any) {
      console.error('Error creating bill:', error);
      if (error.response?.data) {
        return error.response.data as BillResponse;
      }
      return {
        success: false,
        message: error.message || 'Failed to create bill'
      };
    }
  },

  // Update bill
  async updateBill(id: string, updates: {
    billName?: string;
    amount?: number;
    dueDate?: string;
    status?: 'paid' | 'unpaid' | 'overdue';
    type?: 'manual' | 'ocr';
    budgetId?: string;
    description?: string;
    location?: string;
  }): Promise<BillResponse> {
    try {
      const response = await apiService.put<Bill>(`${ENDPOINTS.BILLS.BASE}/${id}`, updates);
      if (!response.data) {
        throw new Error('Failed to update bill');
      }
      return {
        success: true,
        bill: response.data
      };
    } catch (error: any) {
      console.error('Error updating bill:', error);
      if (error.response?.data) {
        return error.response.data as BillResponse;
      }
      return {
        success: false,
        message: error.message || 'Failed to update bill'
      };
    }
  },

  // Update bill status
  async updateBillStatus(id: string, status: Bill['status']): Promise<Bill> {
    try {
      const response = await apiService.put<Bill>(`${ENDPOINTS.BILLS.BASE}/${id}/status`, { status });
      if (!response.data) {
        throw new Error('Failed to update bill status');
      }
      return response.data;
    } catch (error) {
      console.error('Error updating bill status:', error);
      throw error;
    }
  },

  // Delete bill
  async deleteBill(id: string): Promise<void> {
    try {
      await apiService.delete(`${ENDPOINTS.BILLS.BASE}/${id}`);
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  },

  // Get expense summary
  async getExpenseSummary(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ExpenseSummary> {
    try {
      const response = await apiService.get<ExpenseSummary>(`${ENDPOINTS.BILLS.BASE}/summary`, params);
      if (!response.data) {
        throw new Error('Failed to get expense summary');
      }
      return response.data;
    } catch (error) {
      console.error('Error getting expense summary:', error);
      throw error;
    }
  },

  // Get expense trends
  async getExpenseTrends(params?: {
    period?: 'week' | 'month' | 'year';
  }): Promise<ExpenseTrends> {
    try {
      const response = await apiService.get<ExpenseTrends>(`${ENDPOINTS.BILLS.BASE}/trends`, params);
      if (!response.data) {
        throw new Error('Failed to get expense trends');
      }
      return response.data;
    } catch (error) {
      console.error('Error getting expense trends:', error);
      throw error;
    }
  }
}; 