import { API_URL, API_KEY } from '../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define HeadersInit type if it's not available in the environment
type HeadersInit_ = Headers | string[][] | Record<string, string>;
type HeadersInit = HeadersInit_;

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

interface ApiError {
  message: string;
  status?: number;
  stack?: string;
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 5,         // Increased retries for tunnel connections
  initialDelayMs: 1000, // Start with 1 second delay
  maxDelayMs: 15000,    // Maximum delay of 15 seconds
  backoffFactor: 2,     // Exponential backoff factor
  requestTimeout: 60000, // 60 seconds timeout for tunnel connections
};

class ApiService {
  private baseURL = API_URL;

  private async getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'Accept': '*/*',  // Accept any content type
      'Connection': 'keep-alive'  // Use persistent connections
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
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>, customRetryConfig?: Partial<typeof DEFAULT_RETRY_CONFIG>): Promise<ApiResponse<T>> {
    // Merge default config with custom config if provided
    const retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...customRetryConfig
    };
    
    let attempt = 0;
    let delay = retryConfig.initialDelayMs;
    
    // Add query parameters if provided
    let queryString = '';
    if (params) {
      queryString = '?' + Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
    }
    
    while (attempt <= DEFAULT_RETRY_CONFIG.maxRetries) {
      const url = `${this.baseURL}${endpoint}${queryString}`;
      console.log(`Making GET request to: ${url} (attempt ${attempt + 1}/${DEFAULT_RETRY_CONFIG.maxRetries + 1})`);
      console.log(`Current API_URL: ${API_URL}`);
      const headers = await this.getHeaders();
      console.log('Request headers:', JSON.stringify(headers));
      
      try {
        console.log(`Starting fetch with ${DEFAULT_RETRY_CONFIG.requestTimeout}ms timeout`);
        
        // Create a timeout promise
        const timeoutPromise = new Promise<Response>((_, reject) => {
          setTimeout(() => {
            console.warn(`Request to ${url} timed out after ${DEFAULT_RETRY_CONFIG.requestTimeout}ms`);
            reject(new Error('Request timeout'));
          }, DEFAULT_RETRY_CONFIG.requestTimeout);
        });

        // Create the fetch promise
        const fetchPromise = fetch(url, {
          method: 'GET',
          headers
        }).then(response => {
          console.log(`Received response from ${url} with status: ${response.status}`);
          return response;
        }).catch(error => {
          console.error(`Fetch error for ${url}:`, error.message);
          throw error;
        });

        // Race the fetch against the timeout
        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
        console.log('GET response status:', response.status);
        
        // If we get a rate limit error, retry with backoff
        if (response.status === 429) {
          if (attempt === DEFAULT_RETRY_CONFIG.maxRetries) {
            console.error(`Max retries (${DEFAULT_RETRY_CONFIG.maxRetries}) reached for rate-limited request`);
            throw { message: "Rate limit exceeded. Please try again later.", status: 429 };
          }
          
          console.log(`Rate limit hit. Retrying after ${delay}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * DEFAULT_RETRY_CONFIG.backoffFactor, DEFAULT_RETRY_CONFIG.maxDelayMs);
          attempt++;
          continue;
        }
        
        return this.handleResponse<T>(response, { url, method: 'GET', headers });
      } catch (error) {
        console.error('GET request error:', error);
        
        // Handle timeout errors
        if (error instanceof Error && error.message === 'Request timeout') {
          console.error('Request timed out');
          if (attempt < DEFAULT_RETRY_CONFIG.maxRetries) {
            console.log(`Retrying after timeout (attempt ${attempt + 1}/${DEFAULT_RETRY_CONFIG.maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * DEFAULT_RETRY_CONFIG.backoffFactor, DEFAULT_RETRY_CONFIG.maxDelayMs);
            attempt++;
            continue;
          }
          throw { message: 'Request timed out. Please check your network connection and server status.', status: 408 };
        }
        
        // If it's a rate limit error that we're handling with retries
        if (typeof error === 'object' && error !== null && 'status' in error && (error as any).status === 429) {
          if (attempt === DEFAULT_RETRY_CONFIG.maxRetries) {
            throw error;
          }
          
          console.log(`Rate limit error. Retrying after ${delay}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * DEFAULT_RETRY_CONFIG.backoffFactor, DEFAULT_RETRY_CONFIG.maxDelayMs);
          attempt++;
          continue;
        }
        
        // Handle token expiration
        if (error instanceof Error && error.message === 'Token expired') {
          const newToken = await this.refreshAccessToken();
          if (newToken) {
            return this.get<T>(endpoint, params);
          }
        }
        
        throw error; // Let the component handle the error
      }
    }
    
    // This should never be reached due to the throw in the loop, but TypeScript needs it
    throw { message: "Maximum retries exceeded", status: 500 };
  }
  

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    let attempt = 0;
    let delay = DEFAULT_RETRY_CONFIG.initialDelayMs;
    
    while (attempt <= DEFAULT_RETRY_CONFIG.maxRetries) {
      const url = `${this.baseURL}${endpoint}`;
      console.log(`POST request to: ${url}`);
      console.log(`API_URL from constants: ${API_URL}`);
      const headers = await this.getHeaders();
      console.log('Using headers:', JSON.stringify(headers));
      
      try {
        console.log(`Making POST request to: ${url} (attempt ${attempt + 1}/${DEFAULT_RETRY_CONFIG.maxRetries + 1})`);
        
        // Create a timeout promise
        const timeoutPromise = new Promise<Response>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Request timeout'));
          }, DEFAULT_RETRY_CONFIG.requestTimeout);
        });

        // Create the fetch promise with better error handling
        const fetchPromise = fetch(url, {
          method: 'POST',
          headers,
          body: data instanceof FormData ? data : JSON.stringify(data)
        }).then(response => {
          console.log(`Received response from ${url} with status: ${response.status}`);
          return response;
        }).catch(error => {
          console.error(`Fetch error for ${url}:`, error.message);
          throw error;
        });

        // Race the fetch against the timeout
        console.log(`Waiting for response with ${DEFAULT_RETRY_CONFIG.requestTimeout}ms timeout...`);
        const rawResponse = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      
        // If we get a rate limit error, retry with backoff
        if (rawResponse.status === 429) {
          if (attempt === DEFAULT_RETRY_CONFIG.maxRetries) {
            console.error(`Max retries (${DEFAULT_RETRY_CONFIG.maxRetries}) reached for rate-limited request`);
            throw { message: "Rate limit exceeded. Please try again later.", status: 429 };
          }
          
          console.log(`Rate limit hit. Retrying after ${delay}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * DEFAULT_RETRY_CONFIG.backoffFactor, DEFAULT_RETRY_CONFIG.maxDelayMs);
          attempt++;
          continue;
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
          
          // If it's a rate limit error that wasn't caught by the status check
          if (rawResponse.status === 429) {
            if (attempt === DEFAULT_RETRY_CONFIG.maxRetries) {
              throw { message: errMsg, status: rawResponse.status };
            }
            
            console.log(`Rate limit error. Retrying after ${delay}ms delay...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * DEFAULT_RETRY_CONFIG.backoffFactor, DEFAULT_RETRY_CONFIG.maxDelayMs);
            attempt++;
            continue;
          }
          
          throw { message: errMsg, status: rawResponse.status };
        }
        
        // Return proper wrapper from server
        return {
          success: parsed.success,
          message: parsed.message,
          data: parsed.data
        };
      } catch (error) {
        console.error('POST request error:', error);
        
        // Handle timeout errors
        if (error instanceof Error && error.message === 'Request timeout') {
          console.error('Request timed out');
          throw { message: 'Request timed out. Please check your network connection and server status.', status: 408 };
        }
        
        // If it's a rate limit error that we're handling with retries
        if (typeof error === 'object' && error !== null && 'status' in error && (error as any).status === 429) {
          if (attempt === DEFAULT_RETRY_CONFIG.maxRetries) {
            throw error;
          }
          
          console.log(`Rate limit error. Retrying after ${delay}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * DEFAULT_RETRY_CONFIG.backoffFactor, DEFAULT_RETRY_CONFIG.maxDelayMs);
          attempt++;
          continue;
        }
        
        throw error;
      }
    }
    
    // This should never be reached due to the throw in the loop, but TypeScript needs it
    throw { message: "Maximum retries exceeded", status: 500 };
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    let attempt = 0;
    let delay = DEFAULT_RETRY_CONFIG.initialDelayMs;
    
    while (attempt <= DEFAULT_RETRY_CONFIG.maxRetries) {
      const url = `${this.baseURL}${endpoint}`;
      const headers = await this.getHeaders();
      
      try {
        console.log(`Making PUT request to: ${url} (attempt ${attempt + 1}/${DEFAULT_RETRY_CONFIG.maxRetries + 1})`);
        
        // Create a timeout promise
        const timeoutPromise = new Promise<Response>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Request timeout'));
          }, DEFAULT_RETRY_CONFIG.requestTimeout);
        });

        // Create the fetch promise
        const fetchPromise = fetch(url, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data)
        });

        // Race the fetch against the timeout
        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
        
        // If we get a rate limit error, retry with backoff
        if (response.status === 429) {
          if (attempt === DEFAULT_RETRY_CONFIG.maxRetries) {
            console.error(`Max retries (${DEFAULT_RETRY_CONFIG.maxRetries}) reached for rate-limited request`);
            throw { message: "Rate limit exceeded. Please try again later.", status: 429 };
          }
          
          console.log(`Rate limit hit. Retrying after ${delay}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * DEFAULT_RETRY_CONFIG.backoffFactor, DEFAULT_RETRY_CONFIG.maxDelayMs);
          attempt++;
          continue;
        }
        
        return this.handleResponse<T>(response, { url, method: 'PUT', headers, body: JSON.stringify(data) });
      } catch (error) {
        console.error('PUT request error:', error);
        
        // Handle timeout errors
        if (error instanceof Error && error.message === 'Request timeout') {
          console.error('Request timed out');
          throw { message: 'Request timed out. Please check your network connection and server status.', status: 408 };
        }
        
        // If it's a rate limit error that we're handling with retries
        if (typeof error === 'object' && error !== null && 'status' in error && (error as any).status === 429) {
          if (attempt === DEFAULT_RETRY_CONFIG.maxRetries) {
            throw error;
          }
          
          console.log(`Rate limit error. Retrying after ${delay}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * DEFAULT_RETRY_CONFIG.backoffFactor, DEFAULT_RETRY_CONFIG.maxDelayMs);
          attempt++;
          continue;
        }
        
        // Handle token expiration
        if (error instanceof Error && error.message === 'Token expired') {
          const newToken = await this.refreshAccessToken();
          if (newToken) {
            return this.put<T>(endpoint, data);
          }
        }
        
        throw error;
      }
    }
    
    // This should never be reached due to the throw in the loop, but TypeScript needs it
    throw { message: "Maximum retries exceeded", status: 500 };
  }

  async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    let attempt = 0;
    let delay = DEFAULT_RETRY_CONFIG.initialDelayMs;
    
    while (attempt <= DEFAULT_RETRY_CONFIG.maxRetries) {
      const url = `${this.baseURL}${endpoint}`;
      const headers = await this.getHeaders();
      const body = JSON.stringify(data);
      
      try {
        console.log(`Making PATCH request to: ${url} (attempt ${attempt + 1}/${DEFAULT_RETRY_CONFIG.maxRetries + 1})`);
        
        // Create a timeout promise
        const timeoutPromise = new Promise<Response>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Request timeout'));
          }, DEFAULT_RETRY_CONFIG.requestTimeout);
        });

        // Create the fetch promise
        const fetchPromise = fetch(url, {
          method: 'PATCH',
          headers,
          body
        });

        // Race the fetch against the timeout
        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
        
        // If we get a rate limit error, retry with backoff
        if (response.status === 429) {
          if (attempt === DEFAULT_RETRY_CONFIG.maxRetries) {
            console.error(`Max retries (${DEFAULT_RETRY_CONFIG.maxRetries}) reached for rate-limited request`);
            throw { message: "Rate limit exceeded. Please try again later.", status: 429 };
          }
          
          console.log(`Rate limit hit. Retrying after ${delay}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * DEFAULT_RETRY_CONFIG.backoffFactor, DEFAULT_RETRY_CONFIG.maxDelayMs);
          attempt++;
          continue;
        }
        
        return this.handleResponse<T>(response, { url, method: 'PATCH', headers, body });
      } catch (error) {
        console.error('PATCH request error:', error);
        
        // Handle timeout errors
        if (error instanceof Error && error.message === 'Request timeout') {
          console.error('Request timed out');
          throw { message: 'Request timed out. Please check your network connection and server status.', status: 408 };
        }
        
        // If it's a rate limit error that we're handling with retries
        if (typeof error === 'object' && error !== null && 'status' in error && (error as any).status === 429) {
          if (attempt === DEFAULT_RETRY_CONFIG.maxRetries) {
            throw error;
          }
          
          console.log(`Rate limit error. Retrying after ${delay}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * DEFAULT_RETRY_CONFIG.backoffFactor, DEFAULT_RETRY_CONFIG.maxDelayMs);
          attempt++;
          continue;
        }
        
        // Handle token expiration
        if (error instanceof Error && error.message === 'Token expired') {
          const newToken = await this.refreshAccessToken();
          if (newToken) {
            return this.patch<T>(endpoint, data);
          }
        }
        
        throw error;
      }
    }
    
    // This should never be reached due to the throw in the loop, but TypeScript needs it
    throw { message: "Maximum retries exceeded", status: 500 };
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    let attempt = 0;
    let delay = DEFAULT_RETRY_CONFIG.initialDelayMs;
    
    while (attempt <= DEFAULT_RETRY_CONFIG.maxRetries) {
      const url = `${this.baseURL}${endpoint}`;
      const headers = await this.getHeaders();
      
      try {
        console.log(`Making DELETE request to: ${url} (attempt ${attempt + 1}/${DEFAULT_RETRY_CONFIG.maxRetries + 1})`);
        
        // Create a timeout promise
        const timeoutPromise = new Promise<Response>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Request timeout'));
          }, DEFAULT_RETRY_CONFIG.requestTimeout);
        });

        // Create the fetch promise
        const fetchPromise = fetch(url, {
          method: 'DELETE',
          headers
        });

        // Race the fetch against the timeout
        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
        
        // If we get a rate limit error, retry with backoff
        if (response.status === 429) {
          if (attempt === DEFAULT_RETRY_CONFIG.maxRetries) {
            console.error(`Max retries (${DEFAULT_RETRY_CONFIG.maxRetries}) reached for rate-limited request`);
            throw { message: "Rate limit exceeded. Please try again later.", status: 429 };
          }
          
          console.log(`Rate limit hit. Retrying after ${delay}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * DEFAULT_RETRY_CONFIG.backoffFactor, DEFAULT_RETRY_CONFIG.maxDelayMs);
          attempt++;
          continue;
        }
        
        return this.handleResponse<T>(response, { url, method: 'DELETE', headers });
      } catch (error) {
        console.error('DELETE request error:', error);
        
        // Handle timeout errors
        if (error instanceof Error && error.message === 'Request timeout') {
          console.error('Request timed out');
          throw { message: 'Request timed out. Please check your network connection and server status.', status: 408 };
        }
        
        // If it's a rate limit error that we're handling with retries
        if (typeof error === 'object' && error !== null && 'status' in error && (error as any).status === 429) {
          if (attempt === DEFAULT_RETRY_CONFIG.maxRetries) {
            throw error;
          }
          
          console.log(`Rate limit error. Retrying after ${delay}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * DEFAULT_RETRY_CONFIG.backoffFactor, DEFAULT_RETRY_CONFIG.maxDelayMs);
          attempt++;
          continue;
        }
        
        // Handle token expiration
        if (error instanceof Error && error.message === 'Token expired') {
          const newToken = await this.refreshAccessToken();
          if (newToken) {
            return this.delete<T>(endpoint);
          }
        }
        
        throw error;
      }
    }
    
    // This should never be reached due to the throw in the loop, but TypeScript needs it
    throw { message: "Maximum retries exceeded", status: 500 };
  }
  
  async uploadFile<T>(endpoint: string, file: File): Promise<ApiResponse<T>> {
    let attempt = 0;
    let delay = DEFAULT_RETRY_CONFIG.initialDelayMs;
    
    while (attempt <= DEFAULT_RETRY_CONFIG.maxRetries) {
      try {
        const formData = new FormData();
        formData.append('image', file);
        
        const url = `${this.baseURL}${endpoint}`;
        const headers = await this.getHeaders();
        delete headers['Content-Type']; // Let browser set multipart/form-data
        
        console.log(`Making file upload request to: ${url} (attempt ${attempt + 1}/${DEFAULT_RETRY_CONFIG.maxRetries + 1})`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData
        });
        
        // If we get a rate limit error, retry with backoff
        if (response.status === 429) {
          if (attempt === DEFAULT_RETRY_CONFIG.maxRetries) {
            console.error(`Max retries (${DEFAULT_RETRY_CONFIG.maxRetries}) reached for rate-limited request`);
            throw { message: "Rate limit exceeded. Please try again later.", status: 429 };
          }
          
          console.log(`Rate limit hit. Retrying after ${delay}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * DEFAULT_RETRY_CONFIG.backoffFactor, DEFAULT_RETRY_CONFIG.maxDelayMs);
          attempt++;
          continue;
        }
        
        return this.handleResponse<T>(response, { url, method: 'POST', headers });
      } catch (error: unknown) {
        console.error('File upload error:', error);
        
        // If it's a rate limit error that we're handling with retries
        if (typeof error === 'object' && error !== null && 'status' in error && (error as any).status === 429) {
          if (attempt === DEFAULT_RETRY_CONFIG.maxRetries) {
            throw error;
          }
          
          console.log(`Rate limit error. Retrying after ${delay}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * DEFAULT_RETRY_CONFIG.backoffFactor, DEFAULT_RETRY_CONFIG.maxDelayMs);
          attempt++;
          continue;
        }
        
        throw error;
      }
    }
    
    // This should never be reached due to the throw in the loop, but TypeScript needs it
    throw { message: "Maximum retries exceeded", status: 500 };
  }
}

export const apiService = new ApiService();
