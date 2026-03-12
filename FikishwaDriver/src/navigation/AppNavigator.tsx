import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import LandingScreen from '../screens/auth/LandingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import RegistrationScreen from '../screens/auth/RegistrationScreen';
import ReviewScreen from '../screens/auth/ReviewScreen';
import HomeScreen from '../screens/main/HomeScreen';

import ActiveRideScreen from '../screens/main/ActiveRideScreen';
import EarningsScreen from '../screens/main/EarningsScreen';

import { createDrawerNavigator } from '@react-navigation/drawer';
import CustomDrawerContent from './CustomDrawerContent';
import ProfileScreen from '../screens/main/ProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const AuthNavigator = () => (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Landing" component={LandingScreen} />
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="OTP" component={OTPScreen} />
    </AuthStack.Navigator>
);

const MainDrawerNavigator = () => (
    <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
            headerShown: false,
            drawerType: 'slide',
            drawerStyle: {
                width: '80%',
                backgroundColor: 'transparent',
            },
        }}
    >
        <Drawer.Screen name="Home" component={HomeScreen} />
        <Drawer.Screen name="Earnings" component={EarningsScreen} />
        <Drawer.Screen name="Profile" component={ProfileScreen} />
        <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
);

const AppNavigator = () => {
    const { isAuthenticated, user, checkAuth, isLoading } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, []);

    if (isLoading) {
        // TODO: Return Splash Screen
        return null;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!isAuthenticated ? (
                    <Stack.Screen name="Auth" component={AuthNavigator} />
                ) : (
                    <>
                        {/* Logic based on registration status */}
                        {(!user || user.registrationStatus === 'pending' || user.registrationStatus === 'submitted') && (
                            <Stack.Screen name="Registration" component={RegistrationScreen} />
                        )}

                        {user?.registrationStatus === 'pending_review' && (
                            <Stack.Screen name="Review" component={ReviewScreen} />
                        )}

                        {(user?.registrationStatus === 'approved' || user?.registrationStatus === 'rejected') && (
                            <>
                                <Stack.Screen name="Main" component={MainDrawerNavigator} />
                                <Stack.Screen name="ActiveRide" component={ActiveRideScreen} />
                            </>
                        )}
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
