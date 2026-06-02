import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { useAuthStore } from '../store/useAuthStore';
import { View, ActivityIndicator } from 'react-native';
import { registerForPushNotificationsAsync } from '../services/pushNotifications';
import api from '../services/api';
import Constants, { ExecutionEnvironment } from 'expo-constants';

let Notifications: any = null;
const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
try {
    if (!isExpoGo) {
        Notifications = require('expo-notifications');
    }
} catch (e) {
    console.warn('Could not load expo-notifications in RootNavigator');
}

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

            let subscription: any = null;
            let responseSubscription: any = null;

            if (Notifications && !isExpoGo) {
                try {
                    subscription = Notifications.addNotificationReceivedListener((notification: any) => {
                        console.log('Push notification received:', notification);
                    });

                    responseSubscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
                        console.log('Push notification interacted:', response);
                    });
                } catch (err) {
                    console.warn('Failed to attach notification listeners:', err);
                }
            }

            return () => {
                if (subscription) subscription.remove();
                if (responseSubscription) responseSubscription.remove();
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
