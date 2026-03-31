import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
    baseURL: API_BASE_URL,
});

console.log('🌐 [API] Base URL configured as:', API_BASE_URL);

// Attach token on every request
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('customerToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Log API errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error Details:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
        return Promise.reject(error);
    }
);

export default api;
