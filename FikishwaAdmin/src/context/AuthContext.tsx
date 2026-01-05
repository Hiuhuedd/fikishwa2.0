/**
 * Authentication Context
 * Manages auth state, token storage, and login/logout
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY, USER_KEY } from '../services/api';

interface User {
    uid: string;
    phone: string;
    role: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // Load stored auth data on mount
    useEffect(() => {
        loadStoredAuth();
    }, []);

    const loadStoredAuth = async () => {
        console.log('AuthContext: Loading stored auth...');
        try {
            const [storedToken, storedUser] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
            console.log('AuthContext: Stored token exists:', !!storedToken[1]);

            if (storedToken[1] && storedUser[1]) {
                setToken(storedToken[1]);
                setUser(JSON.parse(storedUser[1]));
                console.log('AuthContext: User restored from storage');
            } else {
                console.log('AuthContext: No user found in storage');
            }
        } catch (error) {
            console.error('Error loading stored auth:', error);
        } finally {
            setIsLoading(false);
            console.log('AuthContext: Loading complete');
        }
    };

    const login = useCallback(async (newToken: string, newUser: User) => {
        try {
            await AsyncStorage.multiSet([
                [TOKEN_KEY, newToken],
                [USER_KEY, JSON.stringify(newUser)],
            ]);
            setToken(newToken);
            setUser(newUser);
        } catch (error) {
            console.error('Error storing auth:', error);
            throw error;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
            setToken(null);
            setUser(null);
        } catch (error) {
            console.error('Error clearing auth:', error);
            throw error;
        }
    }, []);

    const value: AuthContextType = {
        isAuthenticated: !!token,
        isLoading,
        user,
        token,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
