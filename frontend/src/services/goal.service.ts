import { API_URL, API_KEY, ENDPOINTS } from '../config/constants';
import { apiService } from './api';
import { authService } from './auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Goal {
  _id: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  targetDate: string;
  type: 'saving' | 'debt' | 'investment';
  status: 'active' | 'completed' | 'cancelled';
  description: string;
  milestones: Milestone[];
}

export interface Milestone {
  _id: string;
  amount: number;
  date: string;
  isAchieved: boolean;
  description: string;
}

export interface GoalResponse {
  success: boolean;
  data: {
    goals?: Goal[];
    goal?: Goal;
    progressPercentage?: number;
    daysRemaining?: number;
    upcomingMilestones?: Milestone[];
  };
  message?: string;
}

// Định nghĩa lại kiểu dữ liệu cho response từ backend
export interface ApiGoalResponse {
  success: boolean;
  message?: string;
  data: {
    goal?: Goal;
    goals?: Goal[];
  };
}

class GoalService {
  async getUserGoals(type?: string, status?: string): Promise<GoalResponse> {
    try {
      // Lấy user data từ authService
      const userData = await authService.getStoredUserData();
      const userId = userData?._id || '';
      
      const endpoint = ENDPOINTS.GOALS.GET_ALL.replace('${userId}', userId);
      const params: Record<string, string> = {};
      if (type) params.type = type;
      if (status) params.status = status;
      
      const response = await apiService.get<any>(endpoint, params);
      console.log('Response from getUserGoals:', response);
      
      // Trả về đúng cấu trúc GoalResponse
      return {
        success: true,
        data: {
          goals: response.data?.goals || []
        },
        message: 'Goals fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching goals:', error);
      return {
        success: false,
        data: {
          goals: []
        },
        message: 'Failed to fetch goals'
      };
    }
  }

  async getGoalDetails(goalId: string): Promise<GoalResponse> {
    try {
      const endpoint = ENDPOINTS.GOALS.GET_DETAILS.replace('${goalId}', goalId);
      const response = await apiService.get<GoalResponse>(endpoint);
      return response.data || { success: false, data: {}, message: 'No data returned' };
    } catch (error) {
      console.error('Error fetching goal details:', error);
      return {
        success: false,
        data: {},
        message: 'Failed to fetch goal details'
      };
    }
  }

  async createGoal(goalData: {
    goalName: string;
    targetAmount: number;
    startDate: string;
    targetDate: string;
    type: string;
    description?: string;
    initialAmount?: number;
    status?: string;
  }): Promise<GoalResponse> {
    try {
      // Lấy user data từ authService
      const userData = await authService.getStoredUserData();
      
      // Thêm userId vào dữ liệu và đảm bảo status là 'active'
      const data = {
        ...goalData,
        userId: userData?._id, // Truyền userId cho backend
        status: goalData.status || 'active' // Đảm bảo status là giá trị hợp lệ
      };
      
      console.log('Sending goal data to backend:', data);
      
      try {
        const response = await apiService.post<any>(ENDPOINTS.GOALS.CREATE_FINANCIAL_GOAL, data);
        console.log('Response from backend:', response);
        
        // Trả về response thành công bất kể cấu trúc dữ liệu từ backend
        return {
          success: true,
          message: 'Goal created successfully',
          data: {
            goal: response.data?.goal || undefined,
            goals: response.data?.goals || undefined
          }
        };
      } catch (apiError: any) {
        console.error('API error creating goal:', apiError);
        
        if (apiError.status === 201) {
          return {
            success: true,
            data: {},
            message: 'Goal created successfully'
          };
        }
        
        throw apiError; // Ném lỗi để xử lý ở catch bên ngoài
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      return {
        success: false,
        data: {},
        message: 'Failed to create goal'
      };
    }
  }

  async updateGoalProgress(goalId: string, progressData: {
    currentAmount?: number;
    milestoneIndex?: number;
    isAchieved?: boolean;
  }): Promise<GoalResponse> {
    try {
      const endpoint = ENDPOINTS.GOALS.UPDATE_PROGRESS.replace('${goalId}', goalId);
      const response = await apiService.put<GoalResponse>(endpoint, progressData);
      return response.data || { success: false, data: {}, message: 'No data returned' };
    } catch (error) {
      console.error('Error updating goal progress:', error);
      return {
        success: false,
        data: {},
        message: 'Failed to update goal progress'
      };
    }
  }

  async checkMilestones(goalId: string): Promise<GoalResponse> {
    try {
      const endpoint = ENDPOINTS.GOALS.CHECK_MILESTONES.replace('${goalId}', goalId);
      const response = await apiService.get<GoalResponse>(endpoint);
      return response.data || { success: false, data: {}, message: 'No data returned' };
    } catch (error) {
      console.error('Error checking milestones:', error);
      return {
        success: false,
        data: {},
        message: 'Failed to check milestones'
      };
    }
  }

  async deleteGoal(goalId: string): Promise<GoalResponse> {
    try {
      const endpoint = ENDPOINTS.GOALS.DELETE(goalId);
      const response = await apiService.delete<GoalResponse>(endpoint);
      return response.data || { success: false, data: {}, message: 'No data returned' };
    } catch (error) {
      console.error('Error deleting goal:', error);
      return {
        success: false,
        data: {},
        message: 'Failed to delete goal'
      };
    }
  }
}

export const goalService = new GoalService();
