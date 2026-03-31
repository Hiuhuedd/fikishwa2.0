import React, { forwardRef } from 'react';
import { View, Image as RNImage, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';

const carMarkerImg = require('../assets/images/car_marker.png');

interface RideMapProps {
    location: any;
    activeRide: any;
    initialRegion: any;
    googleMapsApiKey: string;
}

const RideMap = forwardRef<MapView, RideMapProps>(({ location, activeRide, initialRegion, googleMapsApiKey }, ref) => {
    return (
        <MapView
            ref={ref}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={initialRegion}
        >
            {location && (
                <Marker
                    coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
                    flat
                    rotation={location.coords.heading || 0}
                    anchor={{ x: 0.5, y: 0.5 }}
                >
                    <View style={styles.driverMarkerContainer}>
                        <RNImage source={carMarkerImg} style={{ width: 30, height: 50, resizeMode: 'contain' }} />
                    </View>
                </Marker>
            )}

            {activeRide && (
                <>
                    <Marker
                        coordinate={{
                            latitude: activeRide.pickup.lat || activeRide.pickup.latitude,
                            longitude: activeRide.pickup.lng || activeRide.pickup.longitude
                        }}
                        title="Pickup"
                        pinColor="#4CD964"
                    />
                    <Marker
                        coordinate={{
                            latitude: activeRide.dropoff.lat || activeRide.dropoff.latitude,
                            longitude: activeRide.dropoff.lng || activeRide.dropoff.longitude
                        }}
                        title="Dropoff"
                        pinColor="#FF3B30"
                    />
                    <MapViewDirections
                        origin={location ? { latitude: location.coords.latitude, longitude: location.coords.longitude } : { latitude: activeRide.pickup.lat || activeRide.pickup.latitude, longitude: activeRide.pickup.lng || activeRide.pickup.longitude }}
                        destination={{ latitude: activeRide.dropoff.lat || activeRide.dropoff.latitude, longitude: activeRide.dropoff.lng || activeRide.dropoff.longitude }}
                        waypoints={activeRide.status !== 'in_progress' ? [{ latitude: activeRide.pickup.lat || activeRide.pickup.latitude, longitude: activeRide.pickup.lng || activeRide.pickup.longitude }] : []}
                        apikey={googleMapsApiKey}
                        strokeWidth={4}
                        strokeColor="#007AFF"
                        onReady={(result) => {
                            (ref as any).current?.fitToCoordinates(result.coordinates, {
                                edgePadding: { top: 100, right: 50, bottom: 250, left: 50 },
                                animated: true
                            });
                        }}
                    />
                </>
            )}
        </MapView>
    );
});

const styles = StyleSheet.create({
    map: { ...StyleSheet.absoluteFillObject },
    driverMarkerContainer: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
});

export default RideMap;
