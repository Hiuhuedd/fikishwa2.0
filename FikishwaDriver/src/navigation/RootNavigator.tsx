import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { useAuthStore } from '../store/useAuthStore';
import { View, ActivityIndicator } from 'react-native';

export const RootNavigator = () => {
    const { user, isLoading, initialize } = useAuthStore();

    useEffect(() => {
        initialize();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (!user) {
        return (
            <NavigationContainer>
                <AuthNavigator />
            </NavigationContainer>
        );
    }

    // Determine if driver is fully approved
    const isApproved = user.registrationStatus === 'approved';

    return (
        <NavigationContainer>
            {isApproved ? (
                <MainNavigator />
            ) : (
                <OnboardingNavigator />
            )}
        </NavigationContainer>
    );
};
