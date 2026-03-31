import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY, USER_KEY } from '../services/api';

interface User {
    uid: string;
    phone: string;
    name?: string;
    email?: string;
    registrationStatus?: 'pending' | 'pending_review' | 'approved' | 'rejected';
    role: 'driver';
    address?: string;
    idFrontUrl?: string;
    idBackUrl?: string;
    licenseUrl?: string;
    goodConductUrl?: string;
    carMake?: string;
    carModel?: string;
    carYear?: string;
    plateNumber?: string;
    color?: string;
    taxiNumber?: string | null;
    carImageUrl?: string;
    carRegistrationUrl?: string;
    insuranceUrl?: string;
    inspectionUrl?: string;
    insuranceExpiry?: string;
    inspectionExpiry?: string;
    status: 'active' | 'disabled';
    rejectedReason?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    phoneNumber: string | null;
    sessionId: string | null;
    isLoading: boolean;
    error: string | null;
    setPhoneNumber: (phone: string) => void;
    setSessionId: (id: string) => void;
    setAuth: (user: User, token: string) => Promise<void>;
    logout: () => Promise<void>;
    initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    phoneNumber: null,
    sessionId: null,
    isLoading: true,
    error: null,

    setPhoneNumber: (phoneNumber) => set({ phoneNumber }),
    setSessionId: (sessionId) => set({ sessionId }),

    setAuth: async (user, token) => {
        try {
            await AsyncStorage.setItem(TOKEN_KEY, token);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
            set({ user, token, isLoading: false, error: null });
        } catch (error) {
            console.error('Error saving auth state:', error);
            set({ error: 'Failed to save login session' });
        }
    },

    logout: async () => {
        try {
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
            set({ user: null, token: null, isLoading: false, error: null });
        } catch (error) {
            console.error('Error during logout:', error);
        }
    },

    initialize: async () => {
        try {
            const token = await AsyncStorage.getItem(TOKEN_KEY);
            const userJson = await AsyncStorage.getItem(USER_KEY);
            if (token && userJson) {
                set({ user: JSON.parse(userJson), token, isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('Error initializing auth store:', error);
            set({ isLoading: false });
        }
    },
}));
