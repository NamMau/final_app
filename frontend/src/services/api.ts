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

    const accessToken = await AsyncStorage.getItem('accessToken');
    console.log('Retrieved access token:', accessToken);

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      console.log('Added Authorization header:', headers['Authorization']);
    } else {
      console.warn('No access token found, request will be unauthenticated');
    }

    console.log('Final request headers:', headers);
    return headers;
  }

  private async handleResponse<T>(
    response: Response,
    originalRequest: { url: string; method: string; headers: HeadersInit; body?: string }
  ): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const text = await response.text();
    console.log('API Response Text:', text);
    console.log('Content-Type:', contentType);
    
    let data;
    try {
      // Always try to parse as JSON first
      data = JSON.parse(text);
      console.log('Parsed JSON data:', data);
    } catch (e) {
      console.warn('Failed to parse response as JSON:', e);
      data = text;
    }

    if (!response.ok) {
      const errorMessage = data?.message || `Request failed with status ${response.status}`;
      console.error('API Error:', errorMessage);
      throw { message: errorMessage, status: response.status };
    }

    // If the response is already in ApiResponse format
    if (data?.success !== undefined && data?.data !== undefined) {
      console.log('Response is in ApiResponse format:', data);
      return data as ApiResponse<T>;
    }

    // If the response is the direct data
    return {
      success: true,
      message: 'Success',
      data: data as T
    };
  }

  async refreshAccessToken(): Promise<string | null> {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.error('No refresh token available');
      return null;
    }

    try {
      const response = await this.post<{ accessToken: string }>('/v1/auth/refresh-token', { refreshToken });
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

  // async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
  //   try {
  //     let url = `${this.baseURL}${endpoint}`;
  //     if (params) {
  //       const queryString = new URLSearchParams(params).toString();
  //       url += `?${queryString}`;
  //     }

  //     const headers = await this.getHeaders();
  //     const response = await fetch(url, {
  //       method: 'GET',
  //       headers
  //     });

  //     return this.handleResponse<T>(response, { url, method: 'GET', headers });
  //   } catch (error: unknown) {
  //     console.error('GET request error:', error);
  //     return { success: false, message: 'Failed to fetch data', data: undefined };
  //   }
  // }
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<ApiResponse<T>> {
    try {
      let url = `${this.baseURL}${endpoint}`;
      if (params) {
        const stringParams: Record<string, string> = Object.fromEntries(
          Object.entries(params).map(([key, value]) => [key, String(value)])
        );
        const queryString = new URLSearchParams(stringParams).toString();
        url += `?${queryString}`;
      }

      console.log('Making GET request to:', url);
      const headers = await this.getHeaders();
      console.log('With headers:', headers);

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      console.log('GET Response status:', response.status);
      return await this.handleResponse<T>(response, { url, method: 'GET', headers });
    } catch (error: any) {
      console.error('GET request error:', error);
      if (error.status === 401) {
        // Try to refresh token and retry the request
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          return this.get<T>(endpoint, params);
        }
      }
      throw error; // Let the component handle the error
    }
  }
  

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders();

    // Set up timeout/abort
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let rawResponse: Response;
    try {
      // If data is FormData, don't set Content-Type (browser will set it with boundary)
      if (data instanceof FormData) {
        delete headers['Content-Type'];
      }

      rawResponse = await fetch(url, {
        method: 'POST',
        headers,
        body: data instanceof FormData ? data : JSON.stringify(data),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // Read and parse response
    const text = await rawResponse.text();
    let parsed: ApiResponse<T>;
    try {
      parsed = JSON.parse(text) as ApiResponse<T>;
    } catch {
      throw { message: 'Invalid JSON from server', status: rawResponse.status };
    }

    // If HTTP error, throw with server message
    if (!rawResponse.ok) {
      const errMsg = parsed.message || `Request failed with status ${rawResponse.status}`;
      throw { message: errMsg, status: rawResponse.status };
    }

    // Return proper wrapper from server
    return {
      success: parsed.success,
      message: parsed.message,
      data: parsed.data
    };
  }
  // === HẾT POST SỬA ===

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

  async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = await this.getHeaders();
      const body = JSON.stringify(data);

      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body
      });

      return this.handleResponse<T>(response, { url, method: 'PATCH', headers, body });
    } catch (error: unknown) {
      console.error('PATCH request error:', error);
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
      delete headers['Content-Type']; // để browser tự set multipart/form-data

      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData
      });

      return this.handleResponse<T>(response, { url, method: 'POST', headers });
    } catch (error: unknown) {
      console.error('File upload error:', error);
      return { success: false, message: 'Failed to upload file', data: undefined };
    }
  }
}

export const apiService = new ApiService();
