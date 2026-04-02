import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const TOKEN_KEY = '@fikishwa_driver_token';
export const USER_KEY = '@fikishwa_driver_user';

// API Configuration
// Update this with your actual backend URL
export const API_BASE_URL = "https://fikishwa2-0-backend.onrender.com"


// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
});

// Request interceptor - Add auth token
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const fullUrl = `${config.baseURL}${config.url}`;
        if (__DEV__) {
            console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${fullUrl}`);
        }

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
        if (__DEV__) {
            console.error(`🔴 API Error: ${error.message} | URL: ${error.config?.url} | Status: ${error.response?.status}`);
            if (error.response) {
                console.error(`📋 Data:`, JSON.stringify(error.response.data));
            }
        }

        if (error.response?.status === 401) {
            // Token expired or invalid - clear storage
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
        }
        return Promise.reject(error);
    }
);

export default api;
