import {apiService}  from './api';
import { ENDPOINTS } from '../config/constants';

export interface BillItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Bill {
  id: string;
  userId: string;
  date: Date;
  total: number;
  items: BillItem[];
  image?: string;
  status: 'pending' | 'paid' | 'overdue';
  categoryId?: string;
  type: 'expense' | 'income';
  createdAt: Date;
  updatedAt: Date;
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
      const response = await apiService.get<Bill[]>(ENDPOINTS.BILLS.GET_ALL, params);
      if (!response.data) {
        return [];
      }
      return response.data;
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
  async createBill(bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bill> {
    try {
      const response = await apiService.post<Bill>(ENDPOINTS.BILLS.BASE, bill);
      if (!response.data) {
        throw new Error('Failed to create bill');
      }
      return response.data;
    } catch (error) {
      console.error('Error creating bill:', error);
      throw error;
    }
  },

  // Update bill
  async updateBill(id: string, updates: Partial<Bill>): Promise<Bill> {
    try {
      const response = await apiService.put<Bill>(`${ENDPOINTS.BILLS.BASE}/${id}`, updates);
      if (!response.data) {
        throw new Error('Failed to update bill');
      }
      return response.data;
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
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