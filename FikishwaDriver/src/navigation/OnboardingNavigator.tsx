import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PersonalDetailsScreen from '../screens/Auth/PersonalDetailsScreen';
import IdentityDocumentsScreen from '../screens/Auth/IdentityDocumentScreen';
import DocumentUploadScreen from '../screens/Auth/DocumentUploadScreen';
import VehicleInfoScreen from '../screens/Auth/VehicleInfoScreen';
import StatusPendingScreen from '../screens/Auth/StatusPendingScreen';
import { useAuthStore } from '../store/useAuthStore';

export type OnboardingStackParamList = {
    PersonalDetails: undefined;
    IdentityDocuments: undefined;
    DocumentUpload: undefined;
    VehicleInfo: undefined;
    StatusPending: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator = () => {
    const user = useAuthStore((state) => state.user);

    // Dynamic initial route selection based on profile completeness
    const getInitialRoute = (): keyof OnboardingStackParamList => {
        if (user?.registrationStatus === 'pending_review' || user?.registrationStatus === 'rejected') {
            return 'StatusPending';
        }
        if (!user?.name) return 'PersonalDetails';
        if (!user?.licenseUrl) return 'IdentityDocuments';
        if (!user?.carImageUrl) return 'DocumentUpload';
        if (!user?.carMake) return 'VehicleInfo';
        return 'StatusPending';
    };

    return (
        <Stack.Navigator
            initialRouteName={getInitialRoute()}
            screenOptions={{ headerShown: false }}
        >
            <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
            <Stack.Screen name="IdentityDocuments" component={IdentityDocumentsScreen} />
            <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
            <Stack.Screen name="VehicleInfo" component={VehicleInfoScreen} />
            <Stack.Screen name="StatusPending" component={StatusPendingScreen} />
        </Stack.Navigator>
    );
};
