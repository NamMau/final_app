import { API_URL, API_KEY, ENDPOINTS } from '../config/constants';
import { apiService } from './api';
import { authService } from './auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Loan {
  _id: string;
  loanName: string;
  loanAmount: number;
  remainingBalance: number;
  interestRate: number;
  startDate: string;
  endDate: string;
  monthlyPayment: number;
  status: 'active' | 'completed' | 'defaulted';
  paymentSchedule: {
    dueDate: string;
    amount: number;
    isPaid: boolean;
    paidDate?: string;
    principalPayment?: number;
    interestPayment?: number;
    remainingBalance?: number;
  }[];
  goalID?: string;
}

export interface LoanResponse {
  success: boolean;
  data: {
    loans?: Loan[];
    loan?: Loan;
    goal?: any;
    schedule?: any;
  };
  message?: string;
}

class LoanService {
  async getUserLoans(status?: string): Promise<LoanResponse> {
    try {
      // Lấy user data từ authService
      const userData = await authService.getStoredUserData();
      const userId = userData?._id || '';
      
      const endpoint = ENDPOINTS.LOANS.GET_ALL.replace('${userID}', userId);
      const params: Record<string, string> = {};
      if (status) params.status = status;
      
      const response = await apiService.get<LoanResponse>(endpoint, params);
      return response.data || { success: false, data: {}, message: 'No data returned' };
    } catch (error) {
      console.error('Error fetching loans:', error);
      return {
        success: false,
        data: {},
        message: 'Failed to fetch loans'
      };
    }
  }

  async getLoanDetails(loanId: string): Promise<LoanResponse> {
    try {
      const endpoint = ENDPOINTS.LOANS.GET_DETAILS.replace('${loanID}', loanId);
      const response = await apiService.get<LoanResponse>(endpoint);
      return response.data || { success: false, data: {}, message: 'No data returned' };
    } catch (error) {
      console.error('Error fetching loan details:', error);
      return {
        success: false,
        data: {},
        message: 'Failed to fetch loan details'
      };
    }
  }

  async createLoan(loanData: {
    loanName: string;
    loanAmount: number;
    interestRate: number;
    startDate: string;
    endDate: string;
    monthlyPayment?: number;
    description?: string;
  }): Promise<LoanResponse> {
    try {
      // Lấy user data từ authService
      const userData = await authService.getStoredUserData();
      
      // Thêm userId vào dữ liệu và đảm bảo status là 'active'
      const data = {
        ...loanData,
        userId: userData?._id,
        status: 'active' // Đảm bảo status là giá trị hợp lệ
      };
      
      const response = await apiService.post<LoanResponse>(ENDPOINTS.LOANS.CREATE, data);
      return response.data || { success: false, data: {}, message: 'No data returned' };
    } catch (error) {
      console.error('Error creating loan:', error);
      return {
        success: false,
        data: {},
        message: 'Failed to create loan'
      };
    }
  }

  async createLoanWithGoal(loanData: {
    loanName: string;
    loanAmount: number;
    interestRate: number;
    startDate: string;
    endDate: string;
    monthlyPayment?: number;
    description?: string;
    goalName?: string;
    goalType?: 'debt' | 'saving' | 'investment';
    goalDescription?: string;
  }): Promise<LoanResponse> {
    try {
      // Lấy user data từ authService
      const userData = await authService.getStoredUserData();
      
      // Thêm userId vào dữ liệu và đảm bảo status là 'active'
      const data = {
        ...loanData,
        userId: userData?._id,
        status: 'active', // Đảm bảo status là giá trị hợp lệ
        goal: {
          goalName: loanData.goalName || `Repayment for ${loanData.loanName}`,
          type: loanData.goalType || 'debt',
          targetAmount: loanData.loanAmount,
          startDate: loanData.startDate,
          targetDate: loanData.endDate,
          description: loanData.goalDescription || `Goal for repaying ${loanData.loanName}`,
          status: 'active'
        }
      };
      
      const response = await apiService.post<LoanResponse>(ENDPOINTS.LOANS.CREATE_WITH_GOAL, data);
      return response.data || { success: false, data: {}, message: 'No data returned' };
    } catch (error) {
      console.error('Error creating loan with goal:', error);
      return {
        success: false,
        data: {},
        message: 'Failed to create loan with goal'
      };
    }
  }

  async generatePaymentSchedule(loanData: {
    loanAmount: number;
    interestRate: number;
    startDate: string;
    endDate: string;
    monthlyPayment?: number;
  }): Promise<LoanResponse> {
    try {
      const response = await apiService.post<LoanResponse>(ENDPOINTS.LOANS.GENERATE_SCHEDULE, loanData);
      return response.data || { success: false, data: {}, message: 'No data returned' };
    } catch (error) {
      console.error('Error generating payment schedule:', error);
      return {
        success: false,
        data: {},
        message: 'Failed to generate payment schedule'
      };
    }
  }

  async recordLoanPayment(loanId: string, paymentData: {
    paymentAmount: number;
    paymentDate: string;
    paymentIndex?: number;
    notes?: string;
  }): Promise<LoanResponse> {
    try {
      const endpoint = ENDPOINTS.LOANS.RECORD_PAYMENT.replace('${loanID}', loanId);
      const response = await apiService.post<LoanResponse>(endpoint, paymentData);
      return response.data || { success: false, data: {}, message: 'No data returned' };
    } catch (error) {
      console.error('Error recording loan payment:', error);
      return {
        success: false,
        data: {},
        message: 'Failed to record loan payment'
      };
    }
  }

  async updateLoan(loanId: string, loanData: {
    loanName?: string;
    loanAmount?: number;
    interestRate?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    description?: string;
  }): Promise<LoanResponse> {
    try {
      const endpoint = ENDPOINTS.LOANS.UPDATE(loanId);
      const response = await apiService.put<LoanResponse>(endpoint, loanData);
      return response.data || { success: false, data: {}, message: 'No data returned' };
    } catch (error) {
      console.error('Error updating loan:', error);
      return {
        success: false,
        data: {},
        message: 'Failed to update loan'
      };
    }
  }

  async deleteLoan(loanId: string): Promise<LoanResponse> {
    try {
      const endpoint = ENDPOINTS.LOANS.DELETE(loanId);
      const response = await apiService.delete<LoanResponse>(endpoint);
      return response.data || { success: false, data: {}, message: 'No data returned' };
    } catch (error) {
      console.error('Error deleting loan:', error);
      return {
        success: false,
        data: {},
        message: 'Failed to delete loan'
      };
    }
  }
}

export const loanService = new LoanService();
