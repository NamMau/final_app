import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_KEY } from '../config/constants';

// Default retry configuration
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000, // Start with 1 second delay
  maxDelayMs: 10000,    // Maximum delay of 10 seconds
  backoffFactor: 2,     // Exponential backoff factor
};

/**
 * Creates an axios instance with authentication headers
 */
export const createAuthenticatedAxiosInstance = async () => {
  const token = await AsyncStorage.getItem('accessToken');
  
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
};

/**
 * Makes an API request with retry logic for rate limiting (429 errors)
 * @param requestFn Function that returns a promise for the API request
 * @param retryConfig Configuration for retry behavior
 * @returns Promise with the API response
 */
export const makeRequestWithRetry = async <T>(
  requestFn: () => Promise<AxiosResponse<T>>,
  retryConfig = DEFAULT_RETRY_CONFIG
): Promise<AxiosResponse<T>> => {
  let lastError: AxiosError | Error | null = null;
  let delay = retryConfig.initialDelayMs;
  
  // Try the request up to maxRetries times
  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      // If not the first attempt, log that we're retrying
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${retryConfig.maxRetries} after ${delay}ms delay`);
      }
      
      // Make the request
      return await requestFn();
      
    } catch (error: any) {
      lastError = error;
      
      // Only retry on rate limit errors (429)
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        // If we've used all our retries, throw the error
        if (attempt === retryConfig.maxRetries) {
          console.error(`Max retries (${retryConfig.maxRetries}) reached for rate-limited request`);
          throw error;
        }
        
        // Wait before the next retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Increase the delay for the next attempt (exponential backoff)
        delay = Math.min(delay * retryConfig.backoffFactor, retryConfig.maxDelayMs);
      } else {
        // For other errors, don't retry
        throw error;
      }
    }
  }
  
  // This should never be reached due to the throw in the loop, but TypeScript needs it
  throw lastError;
};

/**
 * Wrapper for GET requests with retry logic
 */
export const getWithRetry = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const axiosInstance = await createAuthenticatedAxiosInstance();
  
  try {
    const response = await makeRequestWithRetry<T>(
      () => axiosInstance.get<T>(url, config),
    );
    return response.data;
  } catch (error) {
    console.error(`GET request to ${url} failed:`, error);
    throw error;
  }
};

/**
 * Wrapper for POST requests with retry logic
 */
export const postWithRetry = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const axiosInstance = await createAuthenticatedAxiosInstance();
  
  try {
    const response = await makeRequestWithRetry<T>(
      () => axiosInstance.post<T>(url, data, config),
    );
    return response.data;
  } catch (error) {
    console.error(`POST request to ${url} failed:`, error);
    throw error;
  }
};

/**
 * Wrapper for PUT requests with retry logic
 */
export const putWithRetry = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const axiosInstance = await createAuthenticatedAxiosInstance();
  
  try {
    const response = await makeRequestWithRetry<T>(
      () => axiosInstance.put<T>(url, data, config),
    );
    return response.data;
  } catch (error) {
    console.error(`PUT request to ${url} failed:`, error);
    throw error;
  }
};

/**
 * Wrapper for DELETE requests with retry logic
 */
export const deleteWithRetry = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const axiosInstance = await createAuthenticatedAxiosInstance();
  
  try {
    const response = await makeRequestWithRetry<T>(
      () => axiosInstance.delete<T>(url, config),
    );
    return response.data;
  } catch (error) {
    console.error(`DELETE request to ${url} failed:`, error);
    throw error;
  }
};
