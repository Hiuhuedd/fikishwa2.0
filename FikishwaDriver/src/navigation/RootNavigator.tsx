import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { useAuthStore } from '../store/useAuthStore';
import { View, ActivityIndicator } from 'react-native';
import { registerForPushNotificationsAsync } from '../services/pushNotifications';
import api from '../services/api';
import * as Notifications from 'expo-notifications';

export const RootNavigator = () => {
    const { user, isLoading, initialize } = useAuthStore();

    useEffect(() => {
        initialize();
    }, []);

    const isApproved = user?.registrationStatus === 'approved';

    useEffect(() => {
        if (user && isApproved) {
            registerForPushNotificationsAsync().then(token => {
                if (token) {
                    console.log('Sending push token to backend...');
                    api.post('/driver/auth/push-token', { pushToken: token }).catch(err => {
                        console.error('Failed to save push token to backend', err);
                    });
                }
            });

            const subscription = Notifications.addNotificationReceivedListener(notification => {
                console.log('Push notification received:', notification);
            });

            const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
                console.log('Push notification interacted:', response);
            });

            return () => {
                subscription.remove();
                responseSubscription.remove();
            };
        }
    }, [user, isApproved]);

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
