import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, Driver } from '../types';
import { jwtDecode } from 'jwt-decode';

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: true,

    login: async (token: string, user: Driver) => {
        await AsyncStorage.setItem('driverToken', token);
        // Also save user data for offline/quick load
        await AsyncStorage.setItem('driverUser', JSON.stringify(user));
        set({ token, user, isAuthenticated: true });
    },

    logout: async () => {
        await AsyncStorage.removeItem('driverToken');
        await AsyncStorage.removeItem('driverUser');
        set({ token: null, user: null, isAuthenticated: false });
    },

    updateUser: (updates) => {
        set((state) => {
            const newUser = state.user ? { ...state.user, ...updates } : null;
            if (newUser) {
                AsyncStorage.setItem('driverUser', JSON.stringify(newUser));
            }
            return { user: newUser };
        });
    },

    checkAuth: async () => {
        try {
            const token = await AsyncStorage.getItem('driverToken');
            const userStr = await AsyncStorage.getItem('driverUser');

            if (token && userStr) {
                // TODO: Verify token expiration
                const user = JSON.parse(userStr);
                set({ token, user, isAuthenticated: true, isLoading: false });
            } else {
                set({ token: null, user: null, isAuthenticated: false, isLoading: false });
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            set({ token: null, user: null, isAuthenticated: false, isLoading: false });
        }
    }
}));
