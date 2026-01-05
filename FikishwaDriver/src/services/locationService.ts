
import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, PermissionStatus } from 'react-native-permissions';
import { locationManager } from '@rnmapbox/maps';

class LocationService {
    private hasLocationPermission: boolean = false;

    constructor() {
        this.setupLocationManager();
    }

    private setupLocationManager() {
        // Start listening for location updates
        locationManager.start();
    }

    /**
     * Request location permissions
     */
    async requestLocationPermission(): Promise<boolean> {
        const permission = Platform.select({
            android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
            ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        });

        if (!permission) return false;

        try {
            const result = await check(permission);

            if (result === RESULTS.GRANTED) {
                this.hasLocationPermission = true;
                return true;
            }

            if (result === RESULTS.DENIED) {
                const requestResult = await request(permission);
                this.hasLocationPermission = requestResult === RESULTS.GRANTED;
                return this.hasLocationPermission;
            }

            return false;
        } catch (error) {
            console.error('Error requesting location permission:', error);
            return false;
        }
    }

    /**
     * Get current location using Mapbox LocationManager
     */
    async getCurrentLocation() {
        if (!this.hasLocationPermission) {
            const granted = await this.requestLocationPermission();
            if (!granted) throw new Error('Location permission denied');
        }

        return await locationManager.getLastKnownLocation();
    }

    /**
     * Clean up listeners
     */
    cleanup() {
        locationManager.stop();
    }
}

export const locationService = new LocationService();
