import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, SafeAreaView, StatusBar, Alert } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { locationService } from '../../services/locationService';
import api from '../../services/api';
import { MAPBOX_STYLE_URL } from '../../config';
import { Colors, Spacing, FontSizes } from '../../theme';
import { useAuthStore } from '../../store/authStore';

const HomeScreen = () => {
    const { user, logout } = useAuthStore();
    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(false);
    const [locationPermission, setLocationPermission] = useState(false);

    useEffect(() => {
        requestPermission();
        return () => {
            locationService.stopTracking();
        };
    }, []);

    const requestPermission = async () => {
        const granted = await locationService.requestLocationPermission();
        setLocationPermission(granted);
    };

    const toggleOnline = async () => {
        try {
            setLoading(true);
            if (!isOnline) {
                // Get current location for the initial "online" request
                const location = await locationService.getCurrentLocation();
                if (!location) throw new Error('Could not get initial location');

                const response = await api.post('/driver/ride/status/online', {
                    location: {
                        lat: location.coords.latitude,
                        lng: location.coords.longitude
                    },
                    selectedCategory: 'standard' // Default for now
                });

                if (response.data.success) {
                    await locationService.startTracking();
                    setIsOnline(true);
                }
            } else {
                const response = await api.post('/driver/ride/status/offline');
                if (response.data.success) {
                    locationService.stopTracking();
                    setIsOnline(false);
                }
            }
        } catch (error: any) {
            console.error('Toggle online error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <Mapbox.MapView style={styles.map} styleURL={MAPBOX_STYLE_URL} logoEnabled={false}>
                <Mapbox.Camera
                    zoomLevel={14}
                    followUserLocation
                    followUserMode={Mapbox.UserTrackingMode.Follow}
                />
                <Mapbox.UserLocation animated={true} />
            </Mapbox.MapView>

            <View style={styles.topOverlay}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.profileCircle} onPress={logout}>
                        <Text style={styles.profileInitial}>{user?.name?.charAt(0) || 'D'}</Text>
                    </TouchableOpacity>
                    <View style={styles.statusBadge}>
                        <View style={[styles.statusDot, { backgroundColor: isOnline ? Colors.success : Colors.error }]} />
                        <Text style={styles.statusText}>{loading ? 'Updating...' : (isOnline ? 'Online' : 'Offline')}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.bottomOverlay}>
                {!isOnline ? (
                    <TouchableOpacity
                        style={[styles.onlineButton, loading && styles.buttonDisabled]}
                        onPress={toggleOnline}
                        disabled={loading}
                    >
                        <Text style={styles.onlineButtonText}>{loading ? 'BOOTING...' : 'GO ONLINE'}</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.onlineButton, styles.offlineButton, loading && styles.buttonDisabled]}
                        onPress={toggleOnline}
                        disabled={loading}
                    >
                        <Text style={styles.onlineButtonText}>{loading ? 'STOPPING...' : 'GO OFFLINE'}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {!locationPermission && (
                <View style={styles.permissionOverlay}>
                    <Text style={styles.permissionText}>Location permission is required to work.</Text>
                    <TouchableOpacity style={styles.smallButton} onPress={requestPermission}>
                        <Text style={styles.smallButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    map: {
        flex: 1,
    },
    topOverlay: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    profileCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.backgroundLighter,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    profileInitial: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 18,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundOverlay,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: '600',
    },
    bottomOverlay: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        paddingHorizontal: 30,
        alignItems: 'center',
    },
    onlineButton: {
        backgroundColor: Colors.primary,
        width: '100%',
        paddingVertical: 18,
        borderRadius: 35,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    offlineButton: {
        backgroundColor: Colors.error,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    onlineButtonText: {
        color: Colors.white,
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
    permissionOverlay: {
        position: 'absolute',
        top: '40%',
        left: 30,
        right: 30,
        backgroundColor: Colors.backgroundOverlay,
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
    },
    permissionText: {
        color: Colors.white,
        textAlign: 'center',
        marginBottom: 15,
    },
    smallButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    smallButtonText: {
        color: Colors.white,
        fontWeight: 'bold',
    },
});

export default HomeScreen;
