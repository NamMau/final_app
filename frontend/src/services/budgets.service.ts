import { API_URL, ENDPOINTS } from '../config/constants';
import { apiService } from './api';
import { authService } from './auth.service';

export interface Budget {
  _id: string;
  userId: string;
  categoryID: string;
  name: string;
  amount: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  alertThreshold: number;
  isActive: boolean;
  progress?: number;
  isOverBudget?: boolean;
  isNearThreshold?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetDto {
  categoryID: string;
  name: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate?: string;
  endDate?: string;
  alertThreshold?: number;
}

export interface UpdateBudgetDto {
  name?: string;
  amount?: number;
  spent?: number;
  period?: 'weekly' | 'monthly' | 'yearly';
  startDate?: string;
  endDate?: string;
  alertThreshold?: number;
  isActive?: boolean;
}

export interface BudgetFilters {
  categoryID?: string;
  period?: 'weekly' | 'monthly' | 'yearly';
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

class BudgetsService {
  async getBudgets(filters?: BudgetFilters): Promise<Budget[]> {
    try {
      console.log('Fetching budgets with filters:', filters);
      // Convert filters to URLSearchParams
      const params = new URLSearchParams();
      if (filters) {
        if (filters.categoryID) params.append('categoryID', filters.categoryID);
        if (filters.period) params.append('period', filters.period);
        if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
      }

      const response = await apiService.get<Budget[]>(ENDPOINTS.BUDGETS.GET_ALL + '?' + params.toString());
      console.log('Budgets response:', response);

      if (!response.success || !response.data) {
        console.error('Failed to fetch budgets:', response);
        throw new Error(response.message || 'Failed to fetch budgets');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching budgets:', error);
      throw error;
    }
  }

  async getBudgetById(id: string): Promise<Budget> {
    try {
      const response = await apiService.get<Budget>(`${ENDPOINTS.BUDGETS.GET_BY_ID}/${id}`);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch budget');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching budget:', error);
      throw error;
    }
  }

  async createBudget(data: CreateBudgetDto): Promise<Budget> {
    try {
      console.log('Creating budget with data:', data);
      const response = await apiService.post<Budget>(ENDPOINTS.BUDGETS.CREATE, data);
      console.log('Create budget response:', response);

      if (!response.success || !response.data) {
        console.error('Failed to create budget:', response);
        throw new Error(response.message || 'Failed to create budget');
      }
      return response.data;
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  }

  async updateBudget(id: string, data: UpdateBudgetDto): Promise<Budget> {
    try {
      console.log('Updating budget:', { id, data });
      const response = await apiService.put<Budget>(`${ENDPOINTS.BUDGETS.UPDATE}/${id}`, data);
      console.log('Update budget response:', response);

      if (!response.success || !response.data) {
        console.error('Failed to update budget:', response);
        throw new Error(response.message || 'Failed to update budget');
      }
      return response.data;
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  }

  async deleteBudget(id: string): Promise<void> {
    try {
      const response = await apiService.delete(`${ENDPOINTS.BUDGETS.DELETE}/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete budget');
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  }
}

export const budgetsService = new BudgetsService();
