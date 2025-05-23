import { apiService } from './api';
import { ENDPOINTS } from '../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserData {
  _id: string;
  email: string;
  userName: string;
  fullName: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  avatar: string;
  createdAt?: string;
}

export interface AccountData {
  id: string;
  userId: string;
  totalBalance: number;
}

export interface LoginResponse {
  user: UserData;
  account: AccountData;
  accessToken: string; // Assuming this is the access token returned from the API
  refreshToken: string; // Assuming this is the refresh token returned from the API
}

export interface RegisterResponse {
  accessToken: string; // Assuming this is the access token returned from the API
  refreshToken: string; // Assuming this is the refresh token returned from the API
  user: UserData;
  account: AccountData;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}



export const authService = {
  // Login function
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      console.log('Sending login request with:', { email });
      const apiResponse = await apiService.post<LoginResponse>(ENDPOINTS.AUTH.LOGIN, { email, password });

      console.log('API Response:', apiResponse);

      if (!apiResponse.success || !apiResponse.data) {
        throw new Error(apiResponse.message || 'Login failed');
      }

      const { accessToken, refreshToken, user, account } = apiResponse.data;
      console.log('Login response user data:', user);

      // Ensure user data has _id
      if (!user._id && (user as any).id) {
        user._id = (user as any).id;
      }

      // Save tokens and user data
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('account', JSON.stringify(account));

      console.log('Stored user data:', user);

      return {
        accessToken,
        refreshToken,
        user,
        account
      };
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message === 'Network request failed') {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      } else if (error.status === 404) {
        throw new Error('Login service is not available. Please try again later.');
      } else if (error.status === 401 || error.message === 'Invalid credentials') {
        throw new Error('Invalid email or password. Please try again.');
      } else {
        throw new Error(error.message || 'Login failed. Please try again.');
      }
    }
  },

  // Register function
  async register(userData: {
    email: string;
    password: string;
    userName: string;
    fullName: string;
    phoneNumber?: string;
    address?: string;
    dateOfBirth?: string;
    avatar: string
  }): Promise<RegisterResponse> {
    try {
      const apiResponse = await apiService.post<RegisterResponse>(ENDPOINTS.AUTH.REGISTER, userData);

      if (!apiResponse.success || !apiResponse.data) {
        throw new Error(apiResponse.message || 'Registration failed');
      }

      const registerData = apiResponse.data;

      // Save tokens and user data
      
      if (registerData.accessToken) {
        await AsyncStorage.setItem('accessToken', registerData.accessToken);
      } // Assuming registerData.token is the accessToken
      if (registerData.refreshToken) {
        await AsyncStorage.setItem('refreshToken', registerData.refreshToken);
      }
      if (registerData.user) {
        await AsyncStorage.setItem('user', JSON.stringify(registerData.user));
      }
      if (registerData.account) {
        await AsyncStorage.setItem('account', JSON.stringify(registerData.account));
      }

      return registerData;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Logout function
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken'); // Ensure refreshToken is also removed
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('account');
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout');
    }
  },

  // Get stored access token
  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('accessToken'); // Retrieve accessToken instead of "token"
    } catch (error) {
      console.error('Error getting stored access token:', error);
      return null;
    }
  },

  // Get stored refresh token
  async getStoredRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('refreshToken'); // Retrieve refreshToken
    } catch (error) {
      console.error('Error getting stored refresh token:', error);
      return null;
    }
  },

  // Get stored user data
  async getStoredUserData(): Promise<UserData | null> {
    try {
      const userDataString = await AsyncStorage.getItem('user');
      console.log('Raw stored user data string:', userDataString);
      
      if (!userDataString) {
        console.log('No user data found in storage');
        return null;
      }
      
      const userData = JSON.parse(userDataString);
      console.log('Parsed user data:', userData);
      
      if (!userData._id) {
        console.error('User data found but no _id field:', userData);
        return null;
      }
      
      return userData as UserData;
    } catch (error) {
      console.error('Error getting stored user data:', error);
      return null;
    }
  },

  // Get stored account data
  async getStoredAccountData(): Promise<AccountData | null> {
    try {
      const accountDataString = await AsyncStorage.getItem('account');
      if (!accountDataString) return null;
      return JSON.parse(accountDataString);
    } catch (error) {
      console.error('Error getting stored account data:', error);
      return null;
    }
  }
};