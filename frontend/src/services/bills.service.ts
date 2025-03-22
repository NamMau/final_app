import { api } from './api';
import { ENDPOINTS } from '../config/constants';

export interface Bill {
  _id?: string;
  userID: string;
  billName: string;
  amount: number;
  dueDate: Date;
  status: 'paid' | 'unpaid';
  imageUrl?: string;
  ocrText?: string;
}

class BillsService {
  async getAllBills(): Promise<Bill[]> {
    const response = await api.get<Bill[]>(ENDPOINTS.BILLS.LIST);
    return response.data || [];
  }

  async createBill(billData: Omit<Bill, '_id'>): Promise<Bill> {
    const billWithDefaults = {
      ...billData,
      status: billData.status || 'unpaid'
    };
    const response = await api.post<Bill>(ENDPOINTS.BILLS.CREATE, billWithDefaults);
    return response.data!;
  }

  async updateBill(id: string, billData: Partial<Bill>): Promise<Bill> {
    const response = await api.put<Bill>(ENDPOINTS.BILLS.UPDATE(id), billData);
    return response.data!;
  }

  async deleteBill(id: string): Promise<void> {
    await api.delete(ENDPOINTS.BILLS.DELETE(id));
  }

  async scanBill(imageFile: any): Promise<{ ocrText: string }> {
    const response = await api.uploadFile<{ ocrText: string }>(ENDPOINTS.BILLS.SCAN, imageFile);
    return response.data!;
  }

  async markAsPaid(id: string): Promise<Bill> {
    return this.updateBill(id, { status: 'paid' });
  }

  async getBillsByStatus(status: 'paid' | 'unpaid'): Promise<Bill[]> {
    const allBills = await this.getAllBills();
    return allBills.filter(bill => bill.status === status);
  }
}

export const billsService = new BillsService(); 