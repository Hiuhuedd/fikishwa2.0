import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    StatusBar,
    Alert,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { Colors, Spacing, FontSizes } from '../../theme';
import { Phone, MessageCircle, Navigation, MapPin, CheckCircle2 } from 'lucide-react-native';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import { MAPBOX_STYLE_URL, MAPBOX_ACCESS_TOKEN } from '../../config/mapbox';
import api from '../../services/api';
import axios from 'axios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const hapticOptions = {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
};

type RideStatus = 'accepted' | 'arrived' | 'in_progress' | 'completed';

const ActiveRideScreen = ({ navigation, route }: any) => {
    const { rideData } = route.params;
    const [status, setStatus] = useState<RideStatus>('accepted');
    const [loading, setLoading] = useState(false);
    const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

    // Map refs
    const cameraRef = useRef<Mapbox.Camera>(null);

    useEffect(() => {
        fetchRoute();
    }, [status]);

    const fetchRoute = async () => {
        try {
            // In a real app, we'd get driver's current location from locationService
            // For now, we'll use a slightly offset starting point for mock testing
            const start = status === 'accepted' || status === 'arrived'
                ? [36.7900, -1.2700] // Start near Westlands 
                : [rideData.pickup.lng, rideData.pickup.lat];

            const end = status === 'accepted' || status === 'arrived'
                ? [rideData.pickup.lng, rideData.pickup.lat]
                : [rideData.dropoff.lng, rideData.dropoff.lat];

            const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`;

            const response = await axios.get(url);
            const coords = response.data.routes[0].geometry.coordinates;
            setRouteCoords(coords);

            // Fit camera to route
            if (cameraRef.current) {
                cameraRef.current.setCamera({
                    bounds: {
                        ne: [Math.max(...coords.map((c: any) => c[0])), Math.max(...coords.map((c: any) => c[1]))],
                        sw: [Math.min(...coords.map((c: any) => c[0])), Math.min(...coords.map((c: any) => c[1]))],
                    },
                    padding: {
                        paddingTop: 100,
                        paddingBottom: 300,
                        paddingLeft: 50,
                        paddingRight: 50
                    },
                    animationDuration: 1000,
                });
            }
        } catch (error) {
            console.error('Error fetching route:', error);
        }
    };

    const handleStatusUpdate = async () => {
        let nextStatus: RideStatus = status;
        let endpoint = '';

        if (status === 'accepted') {
            nextStatus = 'arrived';
            // We don't have a specific "arrived" endpoint in the provided snippets, 
            // but we could use a general update or just local state for now.
            // Let's assume we just update local UI for "Arrived" and call /start after.
            setStatus('arrived');
            ReactNativeHapticFeedback.trigger("impactMedium", hapticOptions);
            return;
        } else if (status === 'arrived') {
            endpoint = '/driver/ride/start';
            nextStatus = 'in_progress';
        } else if (status === 'in_progress') {
            endpoint = '/driver/ride/complete';
            nextStatus = 'completed';
        }

        try {
            setLoading(true);
            const payload: any = { rideId: rideData.rideId };

            if (nextStatus === 'completed') {
                payload.actualDistanceKm = 4.2; // Mock distance
                payload.actualDurationMin = 15; // Mock duration
            }

            const response = await api.post(endpoint, payload);

            if (response.data.success) {
                setStatus(nextStatus);
                ReactNativeHapticFeedback.trigger("notificationSuccess", hapticOptions);

                if (nextStatus === 'completed') {
                    Alert.alert('Ride Completed', 'Great job! You earned KES ' + (rideData.fare * 0.85), [
                        { text: 'Back to Home', onPress: () => navigation.navigate('Home') }
                    ]);
                }
            }
        } catch (error: any) {
            console.error('Status update error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    const getButtonText = () => {
        switch (status) {
            case 'accepted': return "I'VE ARRIVED";
            case 'arrived': return "START TRIP";
            case 'in_progress': return "COMPLETE TRIP";
            case 'completed': return "DONE";
            default: return "UPDATE STATUS";
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <Mapbox.MapView style={styles.map} styleURL={MAPBOX_STYLE_URL} logoEnabled={false}>
                <Mapbox.Camera ref={cameraRef} />

                {/* Route Line */}
                {routeCoords.length > 0 && (
                    <Mapbox.ShapeSource id="routeSource" shape={{
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: routeCoords },
                        properties: {}
                    }}>
                        <Mapbox.LineLayer
                            id="routeLayer"
                            style={{
                                lineColor: Colors.primary,
                                lineWidth: 5,
                                lineCap: 'round',
                                lineJoin: 'round',
                            }}
                        />
                    </Mapbox.ShapeSource>
                )}

                {/* Markers */}
                <Mapbox.PointAnnotation
                    id="pickup"
                    coordinate={[rideData.pickup.lng, rideData.pickup.lat]}
                >
                    <View style={[styles.markerContainer, { backgroundColor: Colors.success }]}>
                        <MapPin size={16} color={Colors.white} />
                    </View>
                </Mapbox.PointAnnotation>

                <Mapbox.PointAnnotation
                    id="dropoff"
                    coordinate={[rideData.dropoff.lng, rideData.dropoff.lat]}
                >
                    <View style={[styles.markerContainer, { backgroundColor: Colors.error }]}>
                        <Navigation size={16} color={Colors.white} />
                    </View>
                </Mapbox.PointAnnotation>
            </Mapbox.MapView>

            {/* Top Info Bar */}
            <View style={styles.topBar}>
                <View style={styles.directionInfo}>
                    <Navigation size={24} color={Colors.primary} />
                    <View style={styles.directionTextContainer}>
                        <Text style={styles.directionDistance}>
                            {status === 'accepted' ? '800m' : rideData.distance}
                        </Text>
                        <Text style={styles.directionStreet}>
                            {status === 'accepted' ? 'Turn right on Waiyaki Way' : 'Heading to destination'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Bottom Interaction Area */}
            <View style={styles.bottomSheet}>
                <View style={styles.customerCard}>
                    <View style={styles.customerHeader}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{rideData.customerName.charAt(0)}</Text>
                        </View>
                        <View style={styles.customerNameContainer}>
                            <Text style={styles.customerName}>{rideData.customerName}</Text>
                            <Text style={styles.rideType}>Standard • KES {rideData.fare}</Text>
                        </View>
                        <View style={styles.actionIcons}>
                            <TouchableOpacity style={styles.iconButton}>
                                <Phone size={20} color={Colors.white} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton}>
                                <MessageCircle size={20} color={Colors.white} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.addressContainer}>
                        <View style={styles.addressRow}>
                            <View style={[styles.dot, { backgroundColor: Colors.success }]} />
                            <Text style={styles.addressText} numberOfLines={1}>{rideData.pickup.address}</Text>
                        </View>
                        <View style={styles.addressLine} />
                        <View style={styles.addressRow}>
                            <View style={[styles.dot, { backgroundColor: Colors.error }]} />
                            <Text style={styles.addressText} numberOfLines={1}>{rideData.dropoff.address}</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={[
                        styles.statusButton,
                        status === 'in_progress' ? styles.completeButton : {},
                        loading && styles.disabledButton
                    ]}
                    onPress={handleStatusUpdate}
                    disabled={loading || status === 'completed'}
                >
                    {loading ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <>
                            <Text style={styles.statusButtonText}>{getButtonText()}</Text>
                            {status === 'in_progress' && <CheckCircle2 size={24} color={Colors.white} style={{ marginLeft: 10 }} />}
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    map: {
        flex: 1,
    },
    markerContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.white,
    },
    topBar: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        backgroundColor: Colors.backgroundOverlay,
        borderRadius: 20,
        padding: Spacing.md,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 10,
    },
    directionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    directionTextContainer: {
        marginLeft: 15,
    },
    directionDistance: {
        color: Colors.white,
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
    },
    directionStreet: {
        color: Colors.textSecondary,
        fontSize: FontSizes.sm,
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.backgroundLight,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: Spacing.lg,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    customerCard: {
        backgroundColor: Colors.backgroundLighter,
        borderRadius: 20,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    customerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    customerNameContainer: {
        flex: 1,
        marginLeft: 12,
    },
    customerName: {
        color: Colors.white,
        fontSize: FontSizes.md,
        fontWeight: 'bold',
    },
    rideType: {
        color: Colors.textSecondary,
        fontSize: 12,
    },
    actionIcons: {
        flexDirection: 'row',
    },
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: Colors.backgroundOverlay,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    addressContainer: {
        marginTop: 5,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 12,
    },
    addressText: {
        color: Colors.textSecondary,
        fontSize: 13,
        flex: 1,
    },
    addressLine: {
        width: 1,
        height: 10,
        backgroundColor: Colors.border,
        marginLeft: 3.5,
        marginVertical: 2,
    },
    statusButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    completeButton: {
        backgroundColor: Colors.success,
    },
    statusButtonText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    disabledButton: {
        opacity: 0.7,
    }
});

export default ActiveRideScreen;
