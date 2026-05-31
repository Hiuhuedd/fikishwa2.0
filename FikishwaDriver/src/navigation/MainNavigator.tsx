import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/Main/HomeScreen';
import EarningsScreen from '../screens/Main/EarningsScreen';
import ReferralScreen from '../screens/Main/ReferralScreen';
import RideHistoryScreen from '../screens/Main/RideHistoryScreen';
import RideDetailScreen from '../screens/Main/RideDetailScreen';
import AccountScreen from '../screens/Main/AccountScreen';
import HelpScreen from '../screens/Main/HelpScreen';
import DisabledAccountScreen from '../screens/Main/DisabledAccountScreen';

export type MainStackParamList = {
    Home: undefined;
    ActiveTrip: { tripId: string };
    Account: undefined;
    Earnings: undefined;
    Referral: undefined;
    History: undefined;
    RideDetail: { ride: any };
    Help: undefined;
    DisabledAccount: { owedAmount: number; maxLimit: number };
    PrivacyPolicy: undefined;
    TermsAgreement: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

import PrivacyPolicyScreen from '../screens/Auth/PrivacyPolicyScreen';
import TermsAgreementScreen from '../screens/Auth/TermsAgreementScreen';

export const MainNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Earnings" component={EarningsScreen} />
            <Stack.Screen name="Referral" component={ReferralScreen} />
            <Stack.Screen name="History" component={RideHistoryScreen} />
            <Stack.Screen name="RideDetail" component={RideDetailScreen} />
            <Stack.Screen name="Account" component={AccountScreen} />
            <Stack.Screen name="Help" component={HelpScreen} />
            <Stack.Screen name="DisabledAccount" component={DisabledAccountScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="TermsAgreement" component={TermsAgreementScreen} />
        </Stack.Navigator>
    );
};
