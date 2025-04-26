import { apiService } from './api';
import { ENDPOINTS } from '../config/constants';

export interface CategorySpending {
  name: string;
  amount: number;
  color: string;
}

export interface BudgetStatus {
  name: string;
  spent: number;
  total: number;
  percentage: number;
}

export interface MonthlyData {
  labels: string[];
  income: number[];
  expenses: number[];
}

export interface FinancialReport {
  _id: string;
  user: string;
  date: string;
  period: 'week' | 'month' | 'year';
  categorySpending: CategorySpending[];
  budgetStatuses: BudgetStatus[];
  monthlyData: MonthlyData;
  insights: string[];
  recommendations: string[];
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialReportResponse {
  success: boolean;
  data: FinancialReport;
}

export interface FinancialReportsListResponse {
  success: boolean;
  data: FinancialReport[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const financialReportsService = {
  // Get all financial reports
  async getFinancialReports(): Promise<FinancialReport[]> {
    try {
      const response = await apiService.get<FinancialReportsListResponse>(ENDPOINTS.FINANCIAL_REPORTS.BASE);
      return response?.data?.data || [];
    } catch (error) {
      console.error('Error fetching financial reports:', error);
      return [];
    }
  },

  // Get a specific financial report by ID
  async getFinancialReportById(reportId: string): Promise<FinancialReport | null> {
    try {
      const response = await apiService.get<FinancialReportResponse>(`${ENDPOINTS.FINANCIAL_REPORTS.BASE}/${reportId}`);
      return response?.data?.data || null;
    } catch (error) {
      console.error('Error fetching financial report:', error);
      return null;
    }
  },

  // Generate a new financial report
  async generateFinancialReport(period: 'week' | 'month' | 'year' = 'month'): Promise<FinancialReport | null> {
    try {
      const response = await apiService.get<FinancialReportResponse>(
        `${ENDPOINTS.FINANCIAL_REPORTS.BASE}/generate?period=${period}`
      );
      return response?.data?.data || null;
    } catch (error) {
      console.error('Error generating financial report:', error);
      return null;
    }
  },

  // Save a financial report
  async saveFinancialReport(reportData: Partial<FinancialReport>): Promise<FinancialReport | null> {
    try {
      const response = await apiService.post<FinancialReportResponse>(
        ENDPOINTS.FINANCIAL_REPORTS.BASE,
        reportData
      );
      return response?.data?.data || null;
    } catch (error) {
      console.error('Error saving financial report:', error);
      return null;
    }
  },

  /**
   * Generate insights and recommendations based on financial data
   * @param data Financial data to analyze
   * @returns Insights and recommendations
   */
  async generateInsights(data: {
    period: string;
    categorySpending: CategorySpending[];
    budgetStatuses: BudgetStatus[];
    monthlyData: MonthlyData;
    balance: number;
  }): Promise<ApiResponse<{ insights: string[]; recommendations: string[] }>> {
    try {
      const response = await apiService.post<ApiResponse<{ insights: string[]; recommendations: string[] }>>(
        `${ENDPOINTS.FINANCIAL_REPORTS.BASE}/insights`,
        data
      );
      
      // Check if response.data exists, otherwise return a default response
      if (response && response.data) {
        return response.data;
      }
      
      // Default response if data is missing
      return {
        success: false,
        message: 'No data received from server',
        data: {
          insights: ['Failed to generate insights'],
          recommendations: ['Please try again later']
        }
      };
    } catch (error) {
      console.error('Error generating insights:', error);
      return {
        success: false,
        message: 'Failed to generate insights',
        data: {
          insights: ['Failed to generate insights'],
          recommendations: ['Please try again later']
        }
      };
    }
  }
};
