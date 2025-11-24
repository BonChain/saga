/**
 * API Client Service for SuiSaga
 * Centralized API communication with environment-based configuration
 */

import axios from 'axios'
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios'

// Environment-based API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
const API_SERVER_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:3001'
const IS_DEVELOPMENT = import.meta.env.DEV

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Enable credentials for JWT cookies
  withCredentials: true,
})

// Request interceptor for logging and debugging
apiClient.interceptors.request.use(
  (config) => {
    if (IS_DEVELOPMENT) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
    }

    // Add JWT token to all API requests (except auth endpoints)
    const token = localStorage.getItem('suisaga_auth_token');
    if (token && !config.url?.includes('/auth/')) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config
  },
  (error: AxiosError) => {
    console.error('❌ API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling and logging
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (IS_DEVELOPMENT) {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`)
    }
    return response
  },
  (error: AxiosError) => {
    if (IS_DEVELOPMENT) {
      console.error(`❌ API Error: ${error.config?.url}`, error.response?.data || error.message)
    }
    return Promise.reject(error)
  }
)

export class ApiClient {
  /**
   * Get the current API configuration
   */
  static getConfig() {
    return {
      baseUrl: API_BASE_URL,
      serverUrl: API_SERVER_URL,
      isDevelopment: IS_DEVELOPMENT,
    }
  }

  /**
   * Health check for the API server
   */
  static async healthCheck(): Promise<{ status: string; timestamp: string }> {
    // health check is on the server root, not /api
    const response = await apiClient.get('/health', { baseURL: API_SERVER_URL })
    return response.data
  }

  /**
   * Get introduction narrative content
   */
  static async getIntroduction(isReturning = false): Promise<any> {
    const response = await apiClient.post('/dialogue/generate', {
      context: 'introduction',
      isReturning: isReturning,
      characterId: 'narrator' // Use a default narrator character
    })
    return response.data
  }

  /**
   * Get world state
   */
  static async getWorldState(): Promise<any> {
    const response = await apiClient.get('/characters')
    return response.data
  }

  /**
   * Get world state regions
   */
  static async getWorldStateRegions(regionId?: string, type?: string): Promise<any> {
    const params: any = {}
    if (regionId) params.regionId = regionId
    if (type) params.type = type

    const response = await apiClient.get('/characters', { params })
    return response.data
  }

  /**
   * Get world state characters
   */
  static async getWorldStateCharacters(characterId?: string): Promise<any> {
    if (characterId) {
      const response = await apiClient.get(`/characters/${characterId}`)
      return response.data
    } else {
      const response = await apiClient.get('/characters')
      return response.data
    }
  }

  /**
   * Generic GET request
   */
  static async get<T = any>(url: string, params?: any): Promise<T> {
    const response = await apiClient.get(url, { params })
    return response.data
  }

  /**
   * Generic POST request
   */
  static async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await apiClient.post(url, data)
    return response.data
  }

  /**
   * Generic PUT request
   */
  static async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await apiClient.put(url, data)
    return response.data
  }

  /**
   * Generic DELETE request
   */
  static async delete<T = any>(url: string): Promise<T> {
    const response = await apiClient.delete(url)
    return response.data
  }
}

export default apiClient