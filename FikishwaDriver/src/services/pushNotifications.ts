import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

let Notifications: any = null;
const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

try {
    if (!isExpoGo) {
        Notifications = require('expo-notifications');
    }
} catch (e) {
    console.warn('Could not load expo-notifications (expected in Expo Go):', e);
}

// Set notification handler to show notifications when the app is in the foreground
if (Notifications && !isExpoGo) {
    try {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
            }),
        });
    } catch (e) {
        console.warn('Failed to set notification handler:', e);
    }
}

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    if (isExpoGo || !Notifications) {
        console.warn('Push notifications are not supported in Expo Go for Android on SDK 53+. Please use a development build.');
        return undefined;
    }

    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return undefined;
        }

        try {
            const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ??
                Constants?.easConfig?.projectId;
                
            if (!projectId) {
                console.warn('Project ID not found in Expo config for push notifications.');
            }

            token = (await Notifications.getExpoPushTokenAsync({
                projectId,
            })).data;
            console.log('Expo Push Token:', token);
        } catch (e) {
            console.error('Error fetching Expo Push Token:', e);
            token = `${e}`;
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}
