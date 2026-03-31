import React, { forwardRef } from 'react';
import { View, ActivityIndicator, TouchableOpacity, StyleSheet, Image } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MapPin, Zap } from 'lucide-react-native';

const carMarkerImg = require('../assets/images/car_marker.png');

interface CustomerMapProps {
    colors: any;
    isMapReady: boolean;
    location: any;
    drivers: any[];
    driverAnimations: any; // Map<string, AnimatedRegion>
    isSelectingSavedPlace: boolean;
    isLocating: boolean;
    onLocateMe: () => void;
    mapStyle: any;
    onUserLocationChange?: (event: any) => void;
    onRegionChangeComplete?: (region: any) => void;
    onMapReady?: () => void;
}

const CustomerMap = forwardRef<MapView, CustomerMapProps>(({
    colors,
    isMapReady,
    location,
    drivers,
    driverAnimations,
    isSelectingSavedPlace,
    isLocating,
    onLocateMe,
    mapStyle,
    onUserLocationChange,
    onRegionChangeComplete,
    onMapReady
}, ref) => {
    return (
        <View style={styles.container}>
            <MapView
                ref={ref}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                customMapStyle={mapStyle}
                showsUserLocation={true}
                showsMyLocationButton={false}
                onMapReady={onMapReady}
                onUserLocationChange={onUserLocationChange}
                onRegionChangeComplete={onRegionChangeComplete}
                initialRegion={{
                    latitude: location?.lat || -1.2864,
                    longitude: location?.lng || 36.8172,
                    latitudeDelta: 0.012,
                    longitudeDelta: 0.012,
                }}
            >
                {/* Active Drivers */}
                {drivers.map((driver) => {
                    const id = driver.id || driver._id;
                    const animation = driverAnimations?.current ? driverAnimations.current.get(id) : driverAnimations?.get(id);

                    if (!animation) return null;

                    return (
                        <Marker.Animated
                            key={id}
                            coordinate={animation as any}
                            anchor={{ x: 0.5, y: 0.5 }}
                            flat={true}
                            rotation={driver.location?.heading || 0}
                        >
                            <Image
                                source={carMarkerImg}
                                style={{ width: 10, height: 35, resizeMode: 'contain' }}
                            />
                        </Marker.Animated>
                    );
                })}
            </MapView>

            {/* Fixed Center Pin for Selection Mode */}
            {isSelectingSavedPlace && (
                <View style={styles.centerPinContainer} pointerEvents="none">
                    <MapPin size={48} color={colors.primary} fill={colors.primary} />
                    <View style={styles.centerPinShadow} />
                </View>
            )}

            {/* Locate Me Button */}
            <TouchableOpacity
                style={[styles.locateButton, { backgroundColor: colors.backgroundCard }]}
                onPress={onLocateMe}
                activeOpacity={0.8}
            >
                {isLocating ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    <Zap size={20} color={colors.primary} />
                )}
            </TouchableOpacity>
        </View>
    );
});

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { ...StyleSheet.absoluteFillObject },
    centerPinContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -24,
        marginTop: -48,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    centerPinShadow: {
        width: 12,
        height: 6,
        borderRadius: 6,
        backgroundColor: 'rgba(0,0,0,0.2)',
        marginTop: -4,
    },
    locateButton: {
        position: 'absolute',
        bottom: 300,
        right: 20,
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        zIndex: 5,
    },
});

export default CustomerMap;
