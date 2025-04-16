import { API_URL, API_KEY } from '../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

interface ApiError {
  message: string;
  status?: number;
  stack?: string;
}

class ApiService {
  private baseURL = API_URL;

  private async getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    };

    // Add auth token if available
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    console.log('Request headers:', headers);
    return headers;
  }

  private async handleResponse<T>(
    response: Response,
    originalRequest: { url: string; method: string; headers: HeadersInit; body?: string }
  ): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const text = await response.text();
    
    let data;
    if (contentType?.includes('application/json')) {
        data = JSON.parse(text);
    } else {
        data = text;
    }

    if (!response.ok) {
        const errorMessage = data?.message || `Request failed with status ${response.status}`;
        throw { message: errorMessage, status: response.status };
    }

    return data;
  }

  async refreshAccessToken(): Promise<string | null> {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
            console.error('No refresh token available');
            return null;
        }

        try {
            const response = await this.post<{ accessToken: string }>('/auth/refresh-token', { refreshToken });
            if (response.success && response.data?.accessToken) {
                await AsyncStorage.setItem('accessToken', response.data.accessToken);
                return response.data.accessToken;
            }
            throw new Error(response.message || 'Failed to refresh access token');
        } catch (error) {
            console.error('Refresh token error:', error);
            return null;
        }
    }

    async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
      try {
          let url = `${this.baseURL}${endpoint}`;
          if (params) {
              const queryString = new URLSearchParams(params).toString();
              url += `?${queryString}`;
          }
  
          const headers = await this.getHeaders();
  
          const response = await fetch(url, {
              method: 'GET',
              headers
          });
  
          return this.handleResponse<T>(response, { url, method: 'GET', headers });
      } catch (error: unknown) {
          console.error('GET request error:', error);
          return { success: false, message: 'Failed to fetch data', data: undefined };
      }
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
        const url = `${this.baseURL}${endpoint}`;
        const headers = await this.getHeaders();
        const body = JSON.stringify(data);

        console.log('\n=== Sending POST Request ===');
        console.log('URL:', url);
        console.log('Headers:', headers);
        console.log('Body:', body);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const contentType = response.headers.get('content-type');
        const text = await response.text();
        
        console.log('\n=== Received Response ===');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Headers:', response.headers);
        console.log('Response Body:', text);

        let responseData;
        if (contentType?.includes('application/json')) {
            responseData = JSON.parse(text);
        } else {
            responseData = text;
        }

        if (!response.ok) {
            if (response.status === 401) {
                const newAccessToken = await this.refreshAccessToken();
                if (newAccessToken) {
                    const retryResponse = await fetch(url, {
                        method: 'POST',
                        headers: {
                            ...headers,
                            Authorization: `Bearer ${newAccessToken}`
                        },
                        body,
                        signal: controller.signal
                    });

                    return this.handleResponse<T>(retryResponse, { url, method: 'POST', headers, body });
                }

                await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user', 'account']);
            }

            const errorMessage = responseData?.message || `Request failed with status ${response.status}`;
            console.error('API Error:', {
                status: response.status,
                message: errorMessage,
                url,
                method: 'POST'
            });
            
            throw { message: errorMessage, status: response.status };
        }

        return responseData;
    } catch (error: unknown) {
        console.error('\n=== POST Request Error ===');
        console.error('Error:', error);
        
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                return { 
                    success: false, 
                    message: 'Request timed out. Please check your internet connection and try again.',
                    data: undefined 
                };
            }
            if (error.message === 'Network request failed') {
                return { 
                    success: false, 
                    message: 'Cannot connect to server. Please check your internet connection and ensure the server is running.',
                    data: undefined 
                };
            }
        }
        
        return { 
            success: false, 
            message: 'Failed to create data. Please try again later.',
            data: undefined 
        };
    }
}

async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
  try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = await this.getHeaders();
      const body = JSON.stringify(data);

      const response = await fetch(url, {
          method: 'PUT',
          headers,
          body
      });

      return this.handleResponse<T>(response, { url, method: 'PUT', headers, body });
  } catch (error: unknown) {
      console.error('PUT request error:', error);
      return { success: false, message: 'Failed to update data', data: undefined };
  }
}

async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
  try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = await this.getHeaders();

      const response = await fetch(url, {
          method: 'DELETE',
          headers
      });

      return this.handleResponse<T>(response, { url, method: 'DELETE', headers });
  } catch (error: unknown) {
      console.error('DELETE request error:', error);
      return { success: false, message: 'Failed to delete data', data: undefined };
  }
}

async uploadFile<T>(endpoint: string, file: File): Promise<ApiResponse<T>> {
  try {
      const formData = new FormData();
      formData.append('image', file);

      const headers = await this.getHeaders();
      delete headers['Content-Type']; // Let the browser set the correct content type for FormData

      const url = `${this.baseURL}${endpoint}`;

      const response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData
      });

      return this.handleResponse<T>(response, {
          url,
          method: 'POST',
          headers,
          body: undefined // FormData cannot be serialized as a string; it's passed directly
      });
  } catch (error: unknown) {
      console.error('File upload error:', error);
      return {
          success: false,
          message: 'Failed to upload file',
          data: undefined
      };
  }
}
}

export const apiService = new ApiService();