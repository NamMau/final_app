import { API_KEY } from '../config/constants';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

interface ApiError {
  message: string;
}

class ApiService {
  private baseURL = 'http://192.168.1.15:4000/api';

  private getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    };
    console.log('Request headers:', headers);
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      console.log(`Response Status: ${response.status}`);
      
      const contentType = response.headers.get('content-type');
      const text = await response.text();

      let data;
      if (contentType?.includes('application/json')) {
        data = JSON.parse(text);
      } else {
        data = text;
      }

      if (!response.ok) {
        throw new Error(data?.message || 'Request failed');
      }

      // Return the response data directly without wrapping it again
      return data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      return { success: false, message: apiError.message || 'An error occurred' };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      console.log(`GET Request URL: ${this.baseURL}${endpoint}`);
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return this.handleResponse<T>(response);
    } catch (error: unknown) {
      console.error('GET request error:', error);
      return { success: false, message: 'Failed to fetch data' };
    }
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      console.log('POST Request URL:', url);
      console.log('POST Request Data:', data);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      return this.handleResponse<T>(response);
    } catch (error: unknown) {
      console.error('POST request error:', error);
      return { success: false, message: 'Failed to create data' };
    }
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      console.log(`PUT Request URL: ${this.baseURL}${endpoint}`);
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      return this.handleResponse<T>(response);
    } catch (error: unknown) {
      console.error('PUT request error:', error);
      return { success: false, message: 'Failed to update data' };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      console.log(`DELETE Request URL: ${this.baseURL}${endpoint}`);
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      return this.handleResponse<T>(response);
    } catch (error: unknown) {
      console.error('DELETE request error:', error);
      return { success: false, message: 'Failed to delete data' };
    }
  }

  async uploadFile<T>(endpoint: string, file: any): Promise<ApiResponse<T>> {
    try {
      const headers = this.getHeaders();
      //delete headers['Content-Type']; // Remove Content-Type for file upload

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('Upload Error:', error);
      return { success: false, message: 'File upload failed' };
    }
  }
}

export const api = new ApiService();