import Mapbox, { locationManager } from '@rnmapbox/maps';
import { socketService } from './socketService';

class LocationService {
    private hasLocationPermission: boolean = false;
    private isTracking: boolean = false;
    private locationListener: ((location: any) => void) | null = null;

    constructor() {
        this.setupLocationManager();
    }

    private setupLocationManager() {
        // Just initialize, don't start yet
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
     * Start real-time tracking and reporting
     */
    async startTracking() {
        if (this.isTracking) return;

        const granted = await this.requestLocationPermission();
        if (!granted) throw new Error('Location permission denied');

        this.isTracking = true;

        // Use static locationManager from Mapbox
        Mapbox.locationManager.start();

        // Stable function reference to avoid NativeEventEmitter issues
        this.locationListener = (location: any) => {
            if (location && socketService.isConnected()) {
                socketService.emit('update-location', {
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                    heading: location.coords.heading,
                    speed: location.coords.speed,
                    timestamp: new Date().toISOString()
                });
            }
        };

        // Subscribe using the stable reference
        Mapbox.locationManager.addListener(this.locationListener);
    }

    /**
     * Stop real-time tracking
     */
    stopTracking() {
        this.isTracking = false;
        if (this.locationListener) {
            Mapbox.locationManager.removeListener(this.locationListener);
            this.locationListener = null;
        }
        Mapbox.locationManager.stop();
    }

    /**
     * Get current location once
     */
    async getCurrentLocation() {
        if (!this.hasLocationPermission) {
            const granted = await this.requestLocationPermission();
            if (!granted) throw new Error('Location permission denied');
        }

        return await Mapbox.locationManager.getLastKnownLocation();
    }

    cleanup() {
        this.stopTracking();
    }
}

// Ensure native permissions are still available (Imported from react-native-permissions)
import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export const locationService = new LocationService();
