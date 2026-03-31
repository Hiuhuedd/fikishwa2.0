import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme/ThemeContext';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import PhoneLoginScreen from '../screens/auth/PhoneLoginScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import SuccessScreen from '../screens/auth/SuccessScreen';

// Main Screens
import HomeScreen from '../screens/main/HomeScreen';
import LocationSearchScreen from '../screens/main/LocationSearchScreen';
import RideOptionsScreen from '../screens/main/RideOptionsScreen';
import MatchingScreen from '../screens/main/MatchingScreen';
import ActiveRideScreen from '../screens/main/ActiveRideScreen';
import RateDriverScreen from '../screens/main/RateDriverScreen';
import RideHistoryScreen from '../screens/main/RideHistoryScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import CouponScreen from '../screens/main/CouponScreen';

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

const AuthNavigator = () => (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
        <AuthStack.Screen name="Register" component={RegisterScreen} />
        <AuthStack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
        <AuthStack.Screen name="OTP" component={OTPScreen} />
        <AuthStack.Screen name="Success" component={SuccessScreen} />
    </AuthStack.Navigator>
);

const MainNavigator = () => (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
        <MainStack.Screen name="Home" component={HomeScreen} />
        <MainStack.Screen name="LocationSearch" component={LocationSearchScreen} options={{ animation: 'fade_from_bottom' }} />
        <MainStack.Screen name="RideOptions" component={RideOptionsScreen} />
        <MainStack.Screen name="Matching" component={MatchingScreen} />
        <MainStack.Screen name="ActiveRide" component={ActiveRideScreen} />
        <MainStack.Screen name="RateDriver" component={RateDriverScreen} />
        <MainStack.Screen name="RideHistory" component={RideHistoryScreen} />
        <MainStack.Screen name="Profile" component={ProfileScreen} />
        <MainStack.Screen name="Coupons" component={CouponScreen} />
    </MainStack.Navigator>
);

const AppNavigator = () => {
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
    const { colors } = useTheme();

    useEffect(() => {
        checkAuth();
    }, []);

    if (isLoading) return null;

    return (
        <NavigationContainer>
            {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
};

export default AppNavigator;
