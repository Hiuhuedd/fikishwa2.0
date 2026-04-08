import React, { forwardRef } from 'react';
import { View, Image as RNImage, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { decodePolyline } from '../utils/mapUtils';

const carMarkerImg = require('../assets/images/car_marker.png');

interface RideMapProps {
    location: any;
    activeRide: any;
    currentRequest: any; // Added for pre-acceptance visualization
    initialRegion: any;
    googleMapsApiKey: string;
}

const RideMap = forwardRef<MapView, RideMapProps>(({ location, activeRide, currentRequest, initialRegion, googleMapsApiKey }, ref) => {

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

            {/* Active Ride Visualization */}
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
                        destination={
                            activeRide.status === 'in_progress'
                                ? { latitude: activeRide.dropoff.lat || activeRide.dropoff.latitude, longitude: activeRide.dropoff.lng || activeRide.dropoff.longitude }
                                : { latitude: activeRide.pickup.lat || activeRide.pickup.latitude, longitude: activeRide.pickup.lng || activeRide.pickup.longitude }
                        }
                        apikey={googleMapsApiKey}
                        strokeWidth={5}
                        strokeColor="#007AFF"
                        onReady={(result) => {
                            (ref as any).current?.fitToCoordinates(result.coordinates, {
                                edgePadding: { top: 100, right: 50, bottom: 250, left: 50 },
                                animated: true,
                            });
                        }}
                    />
                </>
            )}

            {/* Current/Pending Request Visualization */}
            {currentRequest && (
                <>
                    {/* Markers */}
                    <Marker
                        coordinate={{
                            latitude: currentRequest.pickup.lat,
                            longitude: currentRequest.pickup.lng
                        }}
                        title="Pickup"
                        pinColor="#4CD964"
                    />
                    <Marker
                        coordinate={{
                            latitude: currentRequest.dropoff.lat,
                            longitude: currentRequest.dropoff.lng
                        }}
                        title="Dropoff"
                        pinColor="#FF3B30"
                    />

                    {/* Route 1: Driver to Pickup (Blue) */}
                    {location && (
                        <MapViewDirections
                            origin={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
                            destination={{ latitude: currentRequest.pickup.lat, longitude: currentRequest.pickup.lng }}
                            apikey={googleMapsApiKey}
                            strokeWidth={6}
                            strokeColor="#007AFF"
                            lineDashPattern={[10, 10]}
                            onReady={(result) => {
                                // Fit map to show Driver, Pickup, and Dropoff with better padding
                                (ref as any).current?.fitToCoordinates([
                                    { latitude: location.coords.latitude, longitude: location.coords.longitude },
                                    { latitude: currentRequest.pickup.lat, longitude: currentRequest.pickup.lng },
                                    { latitude: currentRequest.dropoff.lat, longitude: currentRequest.dropoff.lng }
                                ], {
                                    edgePadding: { top: 180, right: 60, bottom: 250, left: 60 },
                                    animated: true
                                });
                            }}
                        />
                    )}

                    {/* Route 2: Pickup to Dropoff (Green) - Using Backend Polyline */}
                    {currentRequest.routePolyline && (
                        <Polyline
                            coordinates={decodePolyline(currentRequest.routePolyline)}
                            strokeWidth={8}
                            strokeColor="#4CD964"
                        />
                    )}
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
