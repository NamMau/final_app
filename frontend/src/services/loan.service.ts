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
      
      console.log('Making GET request to:', `${API_URL}${endpoint}?${new URLSearchParams(params).toString()}`);
      
      const response = await apiService.get<any>(endpoint, params);
      console.log('Response is in ApiResponse format:', response);
      
      // Đảm bảo trả về cấu trúc LoanResponse đúng
      if (response && response.data) {
        return {
          success: true,
          data: {
            loans: response.data.loans || []
          },
          message: 'Loans fetched successfully'
        };
      }
      
      return {
        success: true,
        data: {
          loans: []
        },
        message: 'No loans found'
      };
    } catch (error) {
      console.error('Error fetching loans:', error);
      return {
        success: false,
        data: {
          loans: []
        },
        message: 'Failed to fetch loans'
      };
    }
  }

  async getLoanDetails(loanId: string): Promise<LoanResponse> {
    try {
      console.log('Fetching loan details for ID:', loanId);
      const endpoint = ENDPOINTS.LOANS.GET_DETAILS.replace('${loanID}', loanId);
      
      // Sử dụng GET_BY_ID function thay vì string template để tránh lỗi
      // const endpoint = ENDPOINTS.LOANS.GET_BY_ID(loanId);
      
      console.log('Calling endpoint:', `${API_URL}${endpoint}`);
      const response = await apiService.get<any>(endpoint);
      console.log('Loan details response:', response);
      
      // Kiểm tra cấu trúc response từ backend
      if (response) {
        // Nếu response có trường success, sử dụng nó
        if (response.data && typeof response.data.success !== 'undefined') {
          return response.data;
        }
        
        // Nếu response có data và không có trường success, giả định là thành công
        if (response.data) {
          return {
            success: true,
            data: {
              loan: response.data.loan || response.data,
              goal: response.data.goal
            },
            message: 'Loan details fetched successfully'
          };
        }
      }
      
      // Nếu không có data hoặc response không đúng định dạng
      return { success: false, data: {}, message: 'No data returned' };
    } catch (error) {
      console.error('Error fetching loan details:', error);
      return {
        success: false,
        data: {},
        message: error instanceof Error ? error.message : 'Failed to fetch loan details'
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
    goalID?: string;
    remainingBalance?: number;
    paymentSchedule?: any[];
  }): Promise<LoanResponse> {
    try {
      // Lấy user data từ authService
      const userData = await authService.getStoredUserData();
      
      // Tính toán monthlyPayment nếu không được cung cấp
      let monthlyPayment = loanData.monthlyPayment;
      if (!monthlyPayment) {
        const loanDurationMonths = Math.max(1, Math.ceil((new Date(loanData.endDate).getTime() - new Date(loanData.startDate).getTime()) / (30 * 24 * 60 * 60 * 1000)));
        monthlyPayment = loanData.loanAmount / loanDurationMonths;
      }
      
      // Đảm bảo có remainingBalance
      const remainingBalance = loanData.remainingBalance || loanData.loanAmount;
      
      // Thêm userId vào dữ liệu và đảm bảo status là 'active'
      const data = {
        ...loanData,
        userId: userData?._id,
        status: 'active', // Đảm bảo status là giá trị hợp lệ
        monthlyPayment,
        remainingBalance,
        paymentSchedule: loanData.paymentSchedule || []
      };
      
      console.log('Sending loan data to backend:', data);
      
      const response = await apiService.post<any>(ENDPOINTS.LOANS.CREATE, data);
      console.log('Loan creation response:', response);
      
      // Kiểm tra cấu trúc response từ backend
      if (response) {
        // Nếu response có trường success, sử dụng nó
        if (response.data && typeof response.data.success !== 'undefined') {
          return response.data;
        }
        
        // Nếu response có data và không có trường success, giả định là thành công
        if (response.data) {
          return {
            success: true,
            data: {
              loan: response.data.data || response.data
            },
            message: 'Loan created successfully'
          };
        }
      }
      
      return { success: false, data: {}, message: 'No data returned' };
    } catch (error) {
      console.error('Error creating loan:', error);
      return {
        success: false,
        data: {},
        message: error instanceof Error ? error.message : 'Failed to create loan'
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
      console.log('Recording payment for loan:', loanId, 'with data:', paymentData);
      
      // Ensure paymentIndex is a number
      if (paymentData.paymentIndex !== undefined && typeof paymentData.paymentIndex !== 'number') {
        paymentData.paymentIndex = parseInt(String(paymentData.paymentIndex), 10);
        if (isNaN(paymentData.paymentIndex)) {
          console.error('Invalid payment index:', paymentData.paymentIndex);
          return {
            success: false,
            data: {},
            message: 'Invalid payment index'
          };
        }
      }
      
      const endpoint = ENDPOINTS.LOANS.RECORD_PAYMENT.replace('${loanID}', loanId);
      console.log('Making POST request to endpoint:', endpoint);
      
      const response = await apiService.post(endpoint, paymentData);
      console.log('Record payment response:', response);
      
      // Handle different response structures
      if (response) {
        // If response has success field, use it directly
        if (typeof (response as any).success !== 'undefined') {
          const typedResponse = response as any;
          if (typedResponse.success) {
            return {
              success: true,
              data: typedResponse.data || {},
              message: typedResponse.message || 'Payment recorded successfully'
            };
          } else {
            return {
              success: false,
              data: {},
              message: typedResponse.message || 'Failed to record payment'
            };
          }
        }
        
        // If response has data field but no success field
        if ((response as any).data) {
          const typedResponse = response as any;
          // If response.data has success field
          if (typeof typedResponse.data.success !== 'undefined') {
            return typedResponse.data as LoanResponse;
          }
          
          // Otherwise assume success if we have data
          return {
            success: true,
            data: typedResponse.data,
            message: 'Payment recorded successfully'
          };
        }
      }
      
      // Default fallback for unexpected response structure
      return { success: false, data: {}, message: 'Unexpected response format' };
    } catch (error) {
      console.error('Error recording loan payment:', error);
      return {
        success: false,
        data: {},
        message: error instanceof Error ? error.message : 'Failed to record loan payment'
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
