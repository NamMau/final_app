import { api } from './api';
import { ENDPOINTS } from '../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserData {
  id: string;
  email: string;
  userName: string;
  fullName: string;
}

export interface LoginData {
  token: string;
  user: UserData;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export type LoginResponse = ApiResponse<LoginData>;

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      console.log('Sending login request with:', { email });
      const response = await api.post<LoginResponse>(ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });

      console.log('API Response:', response);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Login failed');
      }

      const { token, user } = response.data;
      console.log('Response data:', {
        hasToken: !!token,
        tokenLength: token?.length,
        tokenPreview: token ? `${token.substring(0, 10)}...` : 'no token',
        user: {
          id: user?.id,
          email: user?.email,
          userName: user?.userName,
          fullName: user?.fullName
        }
      });
      
      if (!token) {
        throw new Error('No token received from server');
      }

      // Save token and user data to AsyncStorage
      await this.saveLoginData(token, user);

      return response;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async saveLoginData(token: string, user: UserData): Promise<void> {
    try {
      // Save token
      await AsyncStorage.setItem('userToken', token);
      const savedToken = await AsyncStorage.getItem('userToken');
      console.log('Token saved in AsyncStorage:', !!savedToken);

      // Process and save user data
      const userData = {
        id: user.id,
        userName: user.userName,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: 'Not provided',
        address: 'Not provided',
        dateOfBirth: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        accountInfo: {
          accountId: '',
          totalBalance: 0,
          currency: 'VND'
        }
      };

      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      const savedUserData = await AsyncStorage.getItem('userData');
      console.log('User data saved in AsyncStorage:', !!savedUserData);
    } catch (error) {
      console.error('AsyncStorage error:', error);
      throw new Error('Failed to save login data');
    }
  },

  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout');
    }
  },

  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('userToken');
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  },

  async getStoredUserData(): Promise<UserData | null> {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) return null;
      return JSON.parse(userDataString);
    } catch (error) {
      console.error('Error getting stored user data:', error);
      return null;
    }
  }
}; 