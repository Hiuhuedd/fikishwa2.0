/**
 * API Configuration and Axios Instance
 * Base HTTP client for all API calls
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const TOKEN_KEY = '@fikishwa_admin_token';
export const USER_KEY = '@fikishwa_admin_user';

// API Configuration
// Using the development server IP
const API_BASE_URL = 'http://192.168.100.6:3000';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            const token = await AsyncStorage.getItem(TOKEN_KEY);
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - clear storage
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
        }
        return Promise.reject(error);
    }
);

export default api;
