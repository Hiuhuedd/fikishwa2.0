import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your actual backend URL (localhost for emulator: 10.0.2.2 on Android)
const API_URL = 'http://10.0.2.2:3000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('driverToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
