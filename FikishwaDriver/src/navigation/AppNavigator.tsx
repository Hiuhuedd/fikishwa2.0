import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import LoginScreen from '../screens/auth/LoginScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import RegistrationScreen from '../screens/auth/RegistrationScreen';
import MapTestScreen from '../screens/MapTestScreen';
// import HomeScreen from '../screens/main/HomeScreen'; // To be created

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

const AuthNavigator = () => (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="OTP" component={OTPScreen} />
        <AuthStack.Screen name="Registration" component={RegistrationScreen} />
    </AuthStack.Navigator>
);

const AppNavigator = () => {
    const { isAuthenticated, checkAuth, isLoading } = useAuthStore();

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
                {/* TEMPORARY: Test Map Screen */}
                <Stack.Screen name="MapTest" component={MapTestScreen} />

                {isAuthenticated ? (
                    // Placeholder for Main App
                    <Stack.Screen name="Main" component={() => <></>} />
                ) : (
                    <Stack.Screen name="Auth" component={AuthNavigator} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};


export default AppNavigator;
