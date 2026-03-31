import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    StatusBar, Animated, Dimensions, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE, AnimatedRegion } from 'react-native-maps';
import { Image } from 'react-native';
const carMarkerImg = require('../../assets/images/car_marker.png');
import { useTheme } from '../../theme/ThemeContext';
import { darkMapStyle, lightMapStyle } from '../../theme/mapStyles';
import { useAuthStore } from '../../store/authStore';
import { locationService } from '../../services/locationService';
import api from '../../services/api';
import customerApiService from '../../services/customerApiService';
import { API_ENDPOINTS } from '../../config/api';
import { socketService } from '../../services/socketService';
import {
    Search, MapPin, Clock, Star, ChevronRight, User, Zap, Menu, Plus, Check, Home, Briefcase, Pencil, X, LogOut, Shield, HelpCircle
} from 'lucide-react-native';

// New Modular Components
import CustomerMap from '../../components/CustomerMap';
import HomeHeader from '../../components/HomeHeader';
import QuickPlaces from '../../components/QuickPlaces';
import SavedPlaceSelector from '../../components/SavedPlaceSelector';
import ErrorBanner from '../../components/ErrorBanner';
import ActiveRideBanner from '../../components/ActiveRideBanner';
import CustomerSidebar from '../../components/CustomerSidebar';

// QUICK_PLACES is now computed dynamically inside HomeScreen

const HomeScreen = () => {
    const navigation = useNavigation<any>();
    const { colors, spacing, fontSizes, fontWeights, insets } = useTheme();
    const { user } = useAuthStore();
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [showLocationHelp, setShowLocationHelp] = useState(false);
    const [isMapReady, setIsMapReady] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const hasSnapped = useRef(false);
    const mapRef = useRef<MapView>(null);
    const headerAnim = useRef(new Animated.Value(0)).current;

    // Map Selection Mode State
    const [isSelectingSavedPlace, setIsSelectingSavedPlace] = useState(false);
    const [selectingPlaceType, setSelectingPlaceType] = useState<'Home' | 'Work' | 'Other'>('Home');
    const [previewLocation, setPreviewLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [previewAddress, setPreviewAddress] = useState<string>('Locating...');
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
    const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
    const [activeRide, setActiveRide] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [rideStatus, setRideStatus] = useState<'searching' | 'matched' | 'arriving' | 'arrived' | 'in_progress' | 'completed' | null>(null);
    const driverAnimations = useRef<Map<string, AnimatedRegion>>(new Map());
    const searchingPulseScale = useRef(new Animated.Value(1)).current;
    const geocodeTimeout = useRef<NodeJS.Timeout | null>(null);

    // Safety watchdog for map ready state
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isMapReady) {
                console.warn('[HomeScreen] ⚠️ MapReady watchdog triggered after 10s. Forcing readiness.');
                setIsMapReady(true);
            }
        }, 10000);
        return () => clearTimeout(timer);
    }, [isMapReady]);

    useFocusEffect(
        React.useCallback(() => {
            // Reset snapping so it happens automatically on every entry
            if (!isSelectingSavedPlace) {
                hasSnapped.current = false;
                handleLocateMe();
            }
        }, [isSelectingSavedPlace])
    );

    // Robust Auto-Zoom when both map and location are ready
    useEffect(() => {
        if (isMapReady && location && !hasSnapped.current && !isSelectingSavedPlace) {
            console.log('[HomeScreen] Auto-zoom triggered by MapReady/Location sync');
            hasSnapped.current = true;
            animateZoomIn(location.lng, location.lat);
        }
    }, [isMapReady, location, isSelectingSavedPlace]);

    /**
     * Socket Connection and Drivers
     */
    useEffect(() => {
        if (isSearching) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(searchingPulseScale, { toValue: 1.2, duration: 800, useNativeDriver: true }),
                    Animated.timing(searchingPulseScale, { toValue: 1, duration: 600, useNativeDriver: true }),
                ])
            ).start();
        }
    }, [isSearching]);

    useEffect(() => {
        if (user) {
            console.log('[HomeScreen] Setting up socket listeners for:', user.uid);

            // Fetch active ride on mount
            const checkActiveRide = async () => {
                try {
                    const res = await customerApiService.getActiveRide();
                    if (res.data.success && res.data.ride) {
                        console.log('[HomeScreen] 🚗 Found active ride:', res.data.ride.rideId);
                        setActiveRide(res.data.ride);
                        setRideStatus(res.data.ride.status);
                    }
                } catch (err) {
                    console.log('[HomeScreen] Error fetching active ride:', err);
                }
            };
            checkActiveRide();

            // IMPORTANT: Register listeners BEFORE calling connect
            // This prevents a race condition where events fire before listeners are attached
            socketService.on('available-drivers', (drivers: any[]) => {
                console.log('[HomeScreen] ✅ Received available-drivers event. Count:', drivers?.length, drivers);
                if (!Array.isArray(drivers)) return;
                setAvailableDrivers(drivers);
            });

            socketService.on('ride-matched', (data: any) => {
                console.log('[HomeScreen] Ride Matched:', data);
                setActiveRide(data.ride || data);
                setRideStatus('matched');
            });

            socketService.on('ride-arrived', () => setRideStatus('arrived'));
            socketService.on('ride-started', () => setRideStatus('in_progress'));
            socketService.on('ride-completed', () => {
                setRideStatus('completed');
                setTimeout(() => { setActiveRide(null); setRideStatus(null); handleLocateMe(); }, 3000);
            });

            // Connect AFTER listeners are registered
            socketService.connect(user.uid);

            return () => {
                socketService.off('available-drivers');
                socketService.off('ride-matched');
                socketService.off('ride-arrived');
                socketService.off('ride-started');
                socketService.off('ride-completed');
                socketService.disconnect();
            };
        }
    }, [user]);

    /**
     * HTTP Polling for Available Drivers (reliable fallback independent of sockets)
     * Polls every 5 seconds to always show current drivers on map
     */
    useEffect(() => {
        if (!user) return;

        const fetchDrivers = async () => {
            try {
                const response = await customerApiService.getAvailableDrivers();
                const drivers = response.data?.drivers;
                if (Array.isArray(drivers)) {
                    console.log('[HomeScreen] 🌐 HTTP poll: received', drivers.length, 'drivers');
                    setAvailableDrivers(drivers);
                }
            } catch (err) {
                // Fail silently on poll errors
                console.log('[HomeScreen] HTTP poll error (non-fatal):', err);
            }
        };

        // Fetch immediately on mount
        fetchDrivers();

        // Then poll every 5 seconds
        const interval = setInterval(fetchDrivers, 5000);

        return () => clearInterval(interval);
    }, [user]);

    /**
     * Animate camera to location
     */
    const animateZoomIn = (longitude: number, latitude: number) => {
        try {
            console.log('[HomeScreen] Animating camera to:', latitude, longitude);
            mapRef.current?.animateCamera({
                center: { latitude, longitude },
                zoom: 16, // Approx 500m area
                pitch: 0,
                heading: 0,
            }, { duration: 1500 });
        } catch (error) {
            console.error('[HomeScreen] Zoom animation error:', error);
        }
    };

    const handleLocateMe = async () => {
        setIsLocating(true);
        setLocationError(null);
        setShowLocationHelp(false);
        console.log('[HomeScreen] Manual location request initiated');
        const loc = await locationService.getCurrentLocation();
        if (loc) {
            const { latitude, longitude } = loc.coords;
            console.log('[HomeScreen] Manual/Auto location acquired:', latitude, longitude);
            setLocation({ lat: latitude, lng: longitude });
            // The useEffect above will handle the snapping if map is ready
            // But we also snap here just in case map was already ready
            if (isMapReady && !hasSnapped.current) {
                hasSnapped.current = true;
                animateZoomIn(longitude, latitude);
            }
        } else {
            console.warn('[HomeScreen] Manual location request failed');
            setLocationError('Unable to get your location');
            setShowLocationHelp(true);
        }
        setIsLocating(false);
    };

    const handleRegionChangeComplete = async (region: any) => {
        const { latitude, longitude } = region;
        
        if (isSelectingSavedPlace) {
            setPreviewLocation({ lat: latitude, lng: longitude });
        }

        // Debounce reverse geocoding to save API calls
        if (geocodeTimeout.current) clearTimeout(geocodeTimeout.current);
        geocodeTimeout.current = setTimeout(async () => {
            setIsReverseGeocoding(true);
            try {
                console.log('[HomeScreen] Reverse geocoding for:', latitude, longitude);
                const address = await locationService.getAddressFromCoords(latitude, longitude);
                setPreviewAddress(address || 'Unknown Location');
            } catch (err) {
                setPreviewAddress('Unknown Location');
            } finally {
                setIsReverseGeocoding(false);
            }
        }, 800);
    };

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <CustomerMap
                ref={mapRef}
                colors={colors}
                isMapReady={isMapReady}
                location={location}
                drivers={availableDrivers}
                driverAnimations={driverAnimations}
                isSelectingSavedPlace={isSelectingSavedPlace}
                isLocating={isLocating}
                onLocateMe={handleLocateMe}
                mapStyle={colors.mapStyle.toString() === 'dark' ? darkMapStyle : lightMapStyle}
                onMapReady={() => {
                    console.log('[HomeScreen] ✅ Map Ready callback received');
                    setIsMapReady(true);
                }}
                onRegionChangeComplete={handleRegionChangeComplete}
            />

            {!isMapReady && !locationError && (
                <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Acquiring your location...</Text>
                </View>
            )}

            <ErrorBanner
                error={locationError}
                showHelp={showLocationHelp}
                onSettings={() => locationService.openLocationSettings()}
                onRetry={handleLocateMe}
                colors={colors}
            />

            <HomeHeader
                colors={colors}
                fontSizes={fontSizes}
                spacing={spacing}
                user={user}
                greeting={greeting()}
                insets={insets}
                isSelectingSavedPlace={isSelectingSavedPlace}
                selectingPlaceType={selectingPlaceType}
                onMenuPress={() => setShowSidebar(true)}
                onProfilePress={() => navigation.navigate('Profile')}
                onSearchPress={() => navigation.navigate('LocationSearch', {
                    currentLat: location?.lat,
                    currentLng: location?.lng,
                    currentAddress: previewAddress
                })}
                onCancelSelection={() => setIsSelectingSavedPlace(false)}
            />

            {isSelectingSavedPlace && (
                <SavedPlaceSelector
                    colors={colors}
                    insets={insets}
                    selectingPlaceType={selectingPlaceType}
                    previewAddress={previewAddress}
                    isReverseGeocoding={isReverseGeocoding}
                    onSave={async () => {
                        if (previewLocation && user) {
                            const newSavedPlace = {
                                label: selectingPlaceType,
                                address: previewAddress,
                                lat: previewLocation.lat,
                                lng: previewLocation.lng
                            };
                            const currentSaved = user.savedPlaces || [];
                            const updatedSaved = currentSaved.filter(p => (p as any).label !== selectingPlaceType);
                            updatedSaved.push(newSavedPlace);

                            useAuthStore.getState().updateUser({ savedPlaces: updatedSaved });
                            setIsSelectingSavedPlace(false);
                            handleLocateMe();
                            Alert.alert('Success', `${selectingPlaceType} location updated.`);
                        }
                    }}
                />
            )}

            <View style={[styles.bottomSheet, { backgroundColor: colors.backgroundCard, shadowColor: colors.shadow }]}>
                {!isSelectingSavedPlace && (
                    <>
                        <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

                        <QuickPlaces
                            colors={colors}
                            fontSizes={fontSizes}
                            user={user}
                            onAddPlace={(type) => {
                                setSelectingPlaceType(type);
                                setIsSelectingSavedPlace(true);
                                if (location) animateZoomIn(location.lng, location.lat);
                            }}
                            onSelectPlace={(place) => navigation.navigate('RideOptions', {
                                pickup: { address: previewAddress || 'My current location', lat: location?.lat || -1.2864, lng: location?.lng || 36.8172 },
                                dropoff: { address: place.address || place.label, lat: place.lat, lng: place.lng },
                            })}
                            onEditPlace={(place) => {
                                setSelectingPlaceType(place.label as any);
                                setIsSelectingSavedPlace(true);
                                animateZoomIn(place.lng, place.lat);
                            }}
                        />

                        {activeRide && (
                            <ActiveRideBanner
                                colors={colors}
                                fontSizes={fontSizes}
                                activeRide={activeRide}
                                onPress={() => navigation.navigate('Matching', { rideId: activeRide.rideId || activeRide.id })}
                            />
                        )}
                    </>
                )}
            </View>

            <CustomerSidebar
                visible={showSidebar}
                user={user}
                colors={colors}
                onClose={() => setShowSidebar(false)}
                onNavigation={(screen) => navigation.navigate(screen)}
                onLogout={() => {
                    setShowSidebar(false);
                    useAuthStore.getState().logout();
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '600',
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 12,
        paddingHorizontal: 20,
        paddingBottom: 40,
        elevation: 20,
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        zIndex: 5,
    },
    dragHandle: {
        width: 40,
        height: 5,
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 15,
    },
});

export default HomeScreen;
