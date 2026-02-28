import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, Driver } from '../types';
import { socketService } from '../services/socketService';

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: true,

    login: async (token: string, user: Driver) => {
        await AsyncStorage.setItem('driverToken', token);
        await AsyncStorage.setItem('driverUser', JSON.stringify(user));

        // Connect socket on login
        socketService.connect(user.uid);

        set({ token, user, isAuthenticated: true });
    },

    logout: async () => {
        await AsyncStorage.removeItem('driverToken');
        await AsyncStorage.removeItem('driverUser');

        // Disconnect socket on logout
        socketService.disconnect();

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
                const user = JSON.parse(userStr);

                // Re-connect socket if token exists
                socketService.connect(user.uid);

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
