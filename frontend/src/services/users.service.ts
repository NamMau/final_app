import { ENDPOINTS } from '../config/constants';
import { apiService } from './api';
import { authService } from './auth.service';

export interface User {
  _id: string;
  userName: string;
  email: string;
  fullName: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  address?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'banned';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileDto {
  fullName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  address?: string;
  avatar?: string;
  status?: 'active' | 'inactive' | 'banned';
}

class UserService {
  async getProfile(): Promise<User> {
    try {
      const response = await apiService.get<{ user: User }>(ENDPOINTS.USER.GET_PROFILE);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch profile');
      }
      return response.data.user;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async updateProfile(data: UpdateProfileDto): Promise<User> {
    try {
      const response = await apiService.put<{ updatedUser: User }>(ENDPOINTS.USER.UPDATE_PROFILE, data);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update profile');
      }
      return response.data.updatedUser;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User> {
    try {
      const response = await apiService.get<{ user: User }>(ENDPOINTS.USER.GET_BY_ID(userId));
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch user by ID');
      }
      return response.data.user;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  }

//   async updateUserById(userId: string, data: UpdateProfileDto): Promise<User> {
//     try {
//       const response = await apiService.patch<{ updatedUser: User }>(ENDPOINTS.USER.UPDATE_BY_ID(userId), data);
//       if (!response.success || !response.data) {
//         throw new Error(response.message || 'Failed to update user');
//       }
//       return response.data.updatedUser;
//     } catch (error) {
//       console.error('Error updating user by ID:', error);
//       throw error;
//     }
//   }

//   async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
//     try {
//       const response = await apiService.delete(ENDPOINTS.USER.DELETE_BY_ID(userId));
//       if (!response.success) {
//         throw new Error(response.message || 'Failed to delete user');
//       }
//       return {
//         success: true,
//         message: response.message || 'User deleted successfully',
//       };
//     } catch (error) {
//       console.error('Error deleting user:', error);
//       throw error;
//     }
//   }
}

export const userService = new UserService();
