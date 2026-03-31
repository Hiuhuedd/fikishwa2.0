import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PhoneInputScreen from '../screens/Auth/PhoneInputScreen';
import OtpVerificationScreen from '../screens/Auth/OtpVerificationScreen';

export type AuthStackParamList = {
    PhoneInput: undefined;
    OtpVerification: undefined;
    // Registration: undefined; // To be added
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="PhoneInput" component={PhoneInputScreen} />
            <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        </Stack.Navigator>
    );
};
