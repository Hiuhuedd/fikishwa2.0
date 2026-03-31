import * as Location from 'expo-location';
import axios from 'axios';
import { GOOGLE_MAPS_API_KEY } from '../config/googleMaps';

class LocationService {
    async requestLocationPermission(): Promise<boolean> {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            console.log('[LocationService] Permission check status:', status);
            return status === 'granted';
        } catch (error) {
            console.error('[LocationService] Permission request error:', error);
            return false;
        }
    }

    async openLocationSettings() {
        try {
            await Location.enableNetworkProviderAsync();
        } catch (error) {
            console.error('[LocationService] Error opening location settings:', error);
        }
    }

    async openSettings() {
        // Fallback for general settings if needed
    }

    async isLocationServicesEnabled(): Promise<boolean> {
        try {
            const enabled = await Location.hasServicesEnabledAsync();
            return enabled;
        } catch (error) {
            console.warn('[LocationService] Error checking location services:', error);
            return true;
        }
    }

    async getCurrentLocation(timeoutMs: number = 10000): Promise<any | null> {
        try {
            const hasPermission = await this.requestLocationPermission();
            if (!hasPermission) {
                console.warn('[LocationService] Permissions not granted');
                return null;
            }

            // Quick fallback: Get last known position first for responsiveness
            const lastKnown = await Location.getLastKnownPositionAsync();
            if (lastKnown) {
                console.log('[LocationService] Using last known position');
                // Initiate a fresh high-accuracy request in the background but return last-known for fast UI
                Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => { });
                return {
                    coords: {
                        latitude: lastKnown.coords.latitude,
                        longitude: lastKnown.coords.longitude,
                    },
                };
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            return {
                coords: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                },
            };
        } catch (error) {
            console.error('[LocationService] getCurrentLocation error:', error);
            return null;
        }
    }

    async getAddressFromCoords(lat: number, lng: number): Promise<string | null> {
        try {
            console.log(`[LocationService] Reverse geocoding for: ${lat}, ${lng}`);
            const response = await axios.get(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
            );

            console.log(`[LocationService] Google API status: ${response.data.status}`);

            if (response.data.status === 'OK' && response.data.results.length > 0) {
                const results = response.data.results;
                console.log(`[LocationService] Found ${results.length} results`);

                // Try to find a precise POI or street address
                const preferredTypes = ['point_of_interest', 'establishment', 'premise', 'street_address', 'route', 'intersection'];
                const bestResult = results.find((r: any) =>
                    r.types.some((t: string) => preferredTypes.includes(t))
                ) || results[0];

                const address = bestResult.formatted_address;
                const parts = address.split(',');

                // Return descriptive part (e.g. "Greenhouse Building, Adams")
                if (parts.length >= 2) {
                    return `${parts[0].trim()}, ${parts[1].trim()}`;
                }
                return parts[0].trim();
            } else if (response.data.status === 'ZERO_RESULTS') {
                console.warn('[LocationService] No address results for these coordinates');
                return 'Unknown Area';
            } else {
                console.error('[LocationService] Google API error:', response.data.status, response.data.error_message);
                return null;
            }
        } catch (error: any) {
            console.error('[LocationService] Geocoding exception:', error.message);
            return null;
        }
    }
}

export const locationService = new LocationService();
