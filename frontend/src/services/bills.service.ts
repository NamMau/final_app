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
  createdAt: Date;
  updatedAt: Date;
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
      const response = await api.post<ScanBillResponse>(ENDPOINTS.BILLS.SCAN, {
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
      const response = await api.put<ScanBillResponse>(`${ENDPOINTS.BILLS.BASE}/scan/${billId}`, updates);
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
  async getBills(): Promise<Bill[]> {
    try {
      const response = await api.get<Bill[]>(ENDPOINTS.BILLS.LIST);
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
      const response = await api.get<Bill>(`${ENDPOINTS.BILLS.BASE}/${id}`);
      if (!response.data) {
        throw new Error('Bill not found');
      }
      return response.data;
    } catch (error) {
      console.error('Error getting bill:', error);
      throw error;
    }
  }
}; 