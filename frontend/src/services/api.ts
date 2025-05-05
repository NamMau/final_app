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
  maxRetries: 3,         // Reduced number of retries to avoid excessive requests
  initialDelayMs: 2000, // Start with 2 second delay
  maxDelayMs: 30000,    // Maximum delay of 30 seconds
  backoffFactor: 2,     // Exponential backoff factor
  requestTimeout: 30000, // 30 seconds timeout for connections
};

// Request queue to prevent too many simultaneous requests
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private maxConcurrent = 2; // Maximum number of concurrent requests
  private activeRequests = 0;
  private lastRequestTime = 0;
  private minRequestInterval = 1000; // Minimum time between requests in milliseconds

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          // Ensure minimum time between requests
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          if (timeSinceLastRequest < this.minRequestInterval) {
            await new Promise(r => setTimeout(r, this.minRequestInterval - timeSinceLastRequest));
          }
          
          this.lastRequestTime = Date.now();
          this.activeRequests++;
          const result = await request();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        } finally {
          this.activeRequests--;
          this.processNext();
        }
      });
      
      this.processNext();
    });
  }

  private processNext() {
    if (this.processing) return;
    this.processing = true;
    
    setTimeout(() => {
      if (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
        const request = this.queue.shift();
        if (request) {
          request().catch(() => {});
        }
      }
      this.processing = false;
      
      if (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
        this.processNext();
      }
    }, 0);
  }
}

// Global request queue instance
const requestQueue = new RequestQueue();

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
      console.error('API Error:', errorMessage, 'Status:', response.status);
      
      // Handle 401 Unauthorized errors - attempt to refresh token and retry the request
      if (response.status === 401) {
        console.log('Received 401 Unauthorized, attempting to refresh token...');
        const newToken = await this.refreshAccessToken();
        
        if (newToken) {
          console.log('Token refreshed successfully, retrying original request');
          // Create new headers with the fresh token
          const newHeaders = { ...originalRequest.headers } as Record<string, string>;
          newHeaders['Authorization'] = `Bearer ${newToken}`;
          
          // Retry the original request with the new token
          const retryResponse = await fetch(originalRequest.url, {
            method: originalRequest.method,
            headers: newHeaders,
            body: originalRequest.body
          });
          
          // Process the retry response
          return this.handleResponse<T>(retryResponse, {
            ...originalRequest,
            headers: newHeaders
          });
        } else {
          console.error('Token refresh failed, authentication required');
          // Clear any remaining tokens to ensure clean state
          await AsyncStorage.removeItem('accessToken');
          await AsyncStorage.removeItem('refreshToken');
          await AsyncStorage.removeItem('user');
          
          // Throw a special error that will be caught by the app to redirect to login
          throw { message: 'Authentication required', status: 401, authError: true };
        }
      }
      
      // For other error statuses, just throw the error
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
  };

  // Flag to prevent multiple simultaneous token refresh attempts
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  async refreshAccessToken(): Promise<string | null> {
    // If already refreshing, return the existing promise to prevent multiple refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      console.log('Token refresh already in progress, returning existing promise');
      return this.refreshPromise;
    }
    
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.error('No refresh token available');
      return null;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        console.log('Attempting to refresh access token...');
        // Use direct fetch to avoid circular dependency with our own post method
        const response = await fetch(`${this.baseURL}/v1/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
          },
          body: JSON.stringify({ refreshToken })
        });
        
        const data = await response.json();
        console.log('Refresh token response:', data);
        
        if (response.ok && data.success && data.data?.accessToken) {
          console.log('Token refresh successful');
          await AsyncStorage.setItem('accessToken', data.data.accessToken);
          return data.data.accessToken;
        }
        
        // If refresh fails, clear tokens to force re-login
        console.error('Token refresh failed:', data.message || 'Unknown error');
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        throw new Error(data.message || 'Failed to refresh access token');
      } catch (error) {
        console.error('Refresh token error:', error);
        // Clear tokens on refresh failure
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        return null;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();
    
    return this.refreshPromise;
  }

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
    
    // Add query parameters if provided
    let queryString = '';
    if (params) {
      queryString = '?' + Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
    }
    
    const url = `${this.baseURL}${endpoint}${queryString}`;
    
    // Use the request queue to manage API requests and prevent rate limiting
    return requestQueue.add(async () => {
      let attempt = 0;
      let delay = retryConfig.initialDelayMs;
      
      while (attempt <= retryConfig.maxRetries) {
        console.log(`Making GET request to: ${url} (attempt ${attempt + 1}/${retryConfig.maxRetries + 1})`);
        const headers = await this.getHeaders();
        
        try {
          console.log(`Starting fetch with ${retryConfig.requestTimeout}ms timeout`);
          
          // Create a timeout promise
          const timeoutPromise = new Promise<Response>((_, reject) => {
            setTimeout(() => {
              console.warn(`Request to ${url} timed out after ${retryConfig.requestTimeout}ms`);
              reject(new Error('Request timeout'));
            }, retryConfig.requestTimeout);
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
            if (attempt === retryConfig.maxRetries) {
              console.error(`Max retries (${retryConfig.maxRetries}) reached for rate-limited request`);
              throw { message: "Rate limit exceeded. Please try again later.", status: 429 };
            }
            
            console.log(`Rate limit hit. Retrying after ${delay}ms delay...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * retryConfig.backoffFactor, retryConfig.maxDelayMs);
            attempt++;
            continue;
          }
          
          return this.handleResponse<T>(response, { url, method: 'GET', headers });
        } catch (error) {
          console.error('GET request error:', error);
          
          // Handle timeout errors
          if (error instanceof Error && error.message === 'Request timeout') {
            console.error('Request timed out');
            if (attempt < retryConfig.maxRetries) {
              console.log(`Retrying after timeout (attempt ${attempt + 1}/${retryConfig.maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              delay = Math.min(delay * retryConfig.backoffFactor, retryConfig.maxDelayMs);
              attempt++;
              continue;
            }
            throw { message: 'Request timed out. Please check your network connection and server status.', status: 408 };
          }
          
          // If it's a rate limit error that we're handling with retries
          if (typeof error === 'object' && error !== null && 'status' in error && (error as any).status === 429) {
            if (attempt < retryConfig.maxRetries) {
              console.log(`Retrying after rate limit (attempt ${attempt + 1}/${retryConfig.maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              delay = Math.min(delay * retryConfig.backoffFactor, retryConfig.maxDelayMs);
              attempt++;
              continue;
            }
          }
          
          // Handle authentication errors specially
          if (typeof error === 'object' && error !== null && 'authError' in error && (error as any).authError === true) {
            console.error('Authentication error detected in GET request, redirecting to login');
            // We need to throw this specific error so it can be caught by the app
            throw error;
          }
          
          // For other errors, return a failed response
          return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Failed to fetch data', 
            data: undefined as any
          };
        }
      }
      
      // This should never be reached due to the while loop and return statements
      return { success: false, message: 'Failed to fetch data after all retries', data: undefined as any };
    });
    // This should never be reached due to the throw in the loop, but TypeScript needs it
    throw { message: "Maximum retries exceeded", status: 500 };
  }
  

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Use the request queue to manage API requests and prevent rate limiting
    return requestQueue.add(async () => {
      let attempt = 0;
      let delay = DEFAULT_RETRY_CONFIG.initialDelayMs;
      
      while (attempt <= DEFAULT_RETRY_CONFIG.maxRetries) {
        console.log(`POST request to: ${url} (attempt ${attempt + 1}/${DEFAULT_RETRY_CONFIG.maxRetries + 1})`);
        const headers = await this.getHeaders();
        
        try {
          // Create a timeout promise
          const timeoutPromise = new Promise<Response>((_, reject) => {
            setTimeout(() => {
              console.warn(`Request to ${url} timed out after ${DEFAULT_RETRY_CONFIG.requestTimeout}ms`);
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
            if (attempt < DEFAULT_RETRY_CONFIG.maxRetries) {
              console.log(`Retrying after rate limit (attempt ${attempt + 1}/${DEFAULT_RETRY_CONFIG.maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              delay = Math.min(delay * DEFAULT_RETRY_CONFIG.backoffFactor, DEFAULT_RETRY_CONFIG.maxDelayMs);
              attempt++;
              continue;
            }
          }
          
          // Handle authentication errors specially
          if (typeof error === 'object' && error !== null && 'authError' in error && (error as any).authError === true) {
            console.error('Authentication error detected in POST request, redirecting to login');
            // We need to throw this specific error so it can be caught by the app
            throw error;
          }
          
          // For other errors, return a failed response
          return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Failed to record payment', 
            data: undefined as any
          };
        }
      }
      
      // This should never be reached due to the while loop and return statements
      return { success: false, message: 'Failed to record payment after all retries', data: undefined as any };
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Use the request queue to manage API requests and prevent rate limiting
    return requestQueue.add(async () => {
      let attempt = 0;
      let delay = DEFAULT_RETRY_CONFIG.initialDelayMs;
      
      while (attempt <= DEFAULT_RETRY_CONFIG.maxRetries) {
        const headers = await this.getHeaders();
        
        try {
          console.log(`Making PUT request to: ${url} (attempt ${attempt + 1}/${DEFAULT_RETRY_CONFIG.maxRetries + 1})`);
          
          // Create a timeout promise
          const timeoutPromise = new Promise<Response>((_, reject) => {
            setTimeout(() => {
              console.warn(`Request to ${url} timed out after ${DEFAULT_RETRY_CONFIG.requestTimeout}ms`);
              reject(new Error('Request timeout'));
            }, DEFAULT_RETRY_CONFIG.requestTimeout);
          });

          // Create the fetch promise
          const fetchPromise = fetch(url, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data)
          }).then(response => {
            console.log(`Received response from ${url} with status: ${response.status}`);
            return response;
          }).catch(error => {
            console.error(`Fetch error for ${url}:`, error.message);
            throw error;
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
            if (attempt < DEFAULT_RETRY_CONFIG.maxRetries) {
              console.log(`Retrying after rate limit (attempt ${attempt + 1}/${DEFAULT_RETRY_CONFIG.maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              delay = Math.min(delay * DEFAULT_RETRY_CONFIG.backoffFactor, DEFAULT_RETRY_CONFIG.maxDelayMs);
              attempt++;
              continue;
            }
          }
          
          // Handle token expiration
          if (error instanceof Error && error.message === 'Token expired') {
            const newToken = await this.refreshAccessToken();
            if (newToken) {
              return this.put<T>(endpoint, data);
            }
          }
          
          // For other errors, return a failed response
          return { 
            success: false, 
            message: error instanceof Error ? error.message : 'Failed to update data', 
            data: undefined as any
          };
        }
      }
      
      // This should never be reached due to the while loop and return statements
      return { success: false, message: 'Failed to update data after all retries', data: undefined as any };
    });
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
