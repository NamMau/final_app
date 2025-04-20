import { apiService } from './api'; // Đảm bảo apiService đã được cài đặt và cấu hình.
import { ENDPOINTS } from '../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccountData } from './auth.service';

// export interface AccountData {
//   id: string;
//   userId: string;
//   totalBalance: number;
//   isActive: boolean;
//   createdAt: string;
//   updatedAt: string;
// }

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export const accountService = {

  async createDefaultAccount(userId: string): Promise<ApiResponse<AccountData>> {
    try {
      const response = await apiService.post<ApiResponse<AccountData>>(ENDPOINTS.ACCOUNTS.CREATE_ACCOUNT, { userId });
      if (response.success) {
        return response.data!;
      } else {
        throw new Error(response.message || 'Failed to create default account');
      }
    } catch (error) {   
      console.error('Error creating default account:', error);
      throw error;
    }
  },

  // Lấy tất cả các tài khoản của người dùng
  async getAccounts(userId: string, filters: { isActive?: boolean } = {}): Promise<ApiResponse<AccountData[]>> {
    try {
      const response = await apiService.get<ApiResponse<AccountData[]>>(ENDPOINTS.ACCOUNTS.GET_ALL_ACCOUNTS,
     { userId, ...filters });
      if (response.success) {
        return response.data!;
      } else {
        throw new Error(response.message || 'Failed to fetch accounts');
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  },

  // Lấy thông tin tài khoản theo ID
  async getAccountById(accountId: string): Promise<ApiResponse<AccountData>> {
    try {
      const response = await apiService.get<ApiResponse<AccountData>>(ENDPOINTS.ACCOUNTS.GET_BY_ID(accountId));
      if (response.success) {
        return response.data!;
      } else {
        throw new Error(response.message || 'Failed to fetch account');
      }
    } catch (error) {
      console.error('Error fetching account:', error);
      throw error;
    }
  },

  // Cập nhật tài khoản
  async updateAccount(accountId: string, updateData: { totalBalance?: number; isActive?: boolean }): Promise<ApiResponse<AccountData>> {
    try {
      const response = await apiService.put<ApiResponse<AccountData>>(ENDPOINTS.ACCOUNTS.UPDATE(accountId), updateData);
      if (response.success) {
        return response.data!;
      } else {
        throw new Error(response.message || 'Failed to update account');
      }
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  },

  // Xóa tài khoản
  async deleteAccount(accountId: string): Promise<ApiResponse<null>> {
    try {
      const response = await apiService.delete<ApiResponse<null>>(ENDPOINTS.ACCOUNTS.DELETE(accountId));
      if (response.success) {
        return response.data!;
      } else {
        throw new Error(response.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },

  // Lấy thông tin tài khoản đã lưu trong AsyncStorage
  async getStoredAccountData(): Promise<AccountData | null> {
    try {
      const accountDataString = await AsyncStorage.getItem('account');
      if (!accountDataString) return null;
      return JSON.parse(accountDataString);
    } catch (error) {
      console.error('Error getting stored account data:', error);
      return null;
    }
  },

  // Lưu thông tin tài khoản vào AsyncStorage
  async setStoredAccountData(accountData: AccountData): Promise<void> {
    try {
      await AsyncStorage.setItem('account', JSON.stringify(accountData));
    } catch (error) {
      console.error('Error setting account data to AsyncStorage:', error);
    }
  },

  // Xóa tài khoản khỏi AsyncStorage
  async removeStoredAccountData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('account');
    } catch (error) {
      console.error('Error removing account data from AsyncStorage:', error);
    }
  }
};
