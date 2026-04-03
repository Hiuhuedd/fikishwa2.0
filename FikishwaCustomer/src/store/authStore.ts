import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Customer {
    uid: string;
    phone: string;
    name?: string;
    email?: string;
    photoUrl?: string;
    savedPlaces?: { label: string; address: string; lat: number; lng: number }[];
}

interface AuthState {
    token: string | null;
    user: Customer | null;
    lastIdentifier: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, user: Customer) => Promise<void>;
    saveIdentifier: (id: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (updates: Partial<Customer>) => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    lastIdentifier: null,
    isAuthenticated: false,
    isLoading: true,

    login: async (token, user) => {
        await AsyncStorage.setItem('customerToken', token);
        await AsyncStorage.setItem('customerUser', JSON.stringify(user));
        const id = user.email || user.phone;
        if (id) await AsyncStorage.setItem('last_identifier', id);
        set({ token, user, lastIdentifier: id || null, isAuthenticated: true });
    },

    saveIdentifier: async (id) => {
        await AsyncStorage.setItem('last_identifier', id);
        set({ lastIdentifier: id });
    },

    logout: async () => {
        await AsyncStorage.removeItem('customerToken');
        await AsyncStorage.removeItem('customerUser');
        set({ token: null, user: null, isAuthenticated: false });
    },

    updateUser: (updates) => {
        set((state) => {
            const newUser = state.user ? { ...state.user, ...updates } : null;
            if (newUser) AsyncStorage.setItem('customerUser', JSON.stringify(newUser));
            return { user: newUser };
        });
    },

    checkAuth: async () => {
        try {
            const token = await AsyncStorage.getItem('customerToken');
            const userStr = await AsyncStorage.getItem('customerUser');
            const lastId = await AsyncStorage.getItem('last_identifier');

            set({ lastIdentifier: lastId });

            if (token && userStr) {
                const user = JSON.parse(userStr);
                set({ token, user, isAuthenticated: true, isLoading: false });
            } else {
                set({ token: null, user: null, isAuthenticated: false, isLoading: false });
            }
        } catch {
            set({ token: null, user: null, isAuthenticated: false, isLoading: false });
        }
    },
}));
