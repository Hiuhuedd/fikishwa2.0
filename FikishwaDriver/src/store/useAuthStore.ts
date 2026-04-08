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
    profilePhotoUrl?: string;
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
    averageRating?: number;
    totalRides?: number;
    totalEarnings?: number;
    totalRatingsCount?: number;
}

interface AuthState {
    user: User | null;
    token: string | null;
    phoneNumber: string | null;
    lastIdentifier: string | null;
    sessionId: string | null;
    isLoading: boolean;
    error: string | null;
    setPhoneNumber: (phone: string) => void;
    setSessionId: (id: string) => void;
    setAuth: (user: User, token: string) => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    logout: () => Promise<void>;
    initialize: () => Promise<void>;
}

const LAST_ID_KEY = 'last_identifier';

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    phoneNumber: null,
    lastIdentifier: null,
    sessionId: null,
    isLoading: true,
    error: null,

    setPhoneNumber: (phoneNumber) => {
        set({ phoneNumber });
        AsyncStorage.setItem(LAST_ID_KEY, phoneNumber);
    },
    setSessionId: (sessionId) => set({ sessionId }),

    setAuth: async (user, token) => {
        try {
            await AsyncStorage.setItem(TOKEN_KEY, token);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
            // Also ensure the identifier is saved
            const id = user.email || user.phone;
            if (id) await AsyncStorage.setItem(LAST_ID_KEY, id);
            set({ user, token, lastIdentifier: id || null, isLoading: false, error: null });
        } catch (error) {
            console.error('Error saving auth state:', error);
            set({ error: 'Failed to save login session' });
        }
    },

    updateUser: async (user) => {
        try {
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
            set({ user });
        } catch (error) {
            console.error('Error updating user state:', error);
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
            const lastId = await AsyncStorage.getItem(LAST_ID_KEY);

            set({ lastIdentifier: lastId });

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
