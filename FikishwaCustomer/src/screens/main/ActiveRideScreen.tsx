import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Alert, Image, Animated, Modal, ActivityIndicator, Linking, Share
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE, AnimatedRegion } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { useTheme } from '../../theme/ThemeContext';
import { darkMapStyle, lightMapStyle } from '../../theme/mapStyles';
import { socketService } from '../../services/socketService';
import api from '../../services/api';
import { MessageCircle, Shield, Navigation, X, Phone as PhoneIcon } from 'lucide-react-native';
import { GOOGLE_MAPS_API_KEY } from '../../config/googleMaps';
import { decodePolyline } from '../../utils/polyline';
import PremiumModal from '../../components/PremiumModal';
import PremiumAlert from '../../components/PremiumAlert';
import SafetyToolkitModal from '../../components/SafetyToolkitModal';

const carMarkerImg = require('../../assets/images/car_marker.png');

const ActiveRideScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { rideId, pickup, dropoff, paymentMethod, estimatedFare, driver, initialStatus } = route.params || {};
    const { colors, fontSizes, spacing, insets } = useTheme();
    const mapRef = useRef<MapView>(null);

    const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [driverRoute, setDriverRoute] = useState<any[]>([]);
    const lastRouteFetch = useRef<number>(0);

    const driverAnim = useRef(new AnimatedRegion({
        latitude: pickup?.lat || 0,
        longitude: pickup?.lng || 0,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    })).current;

    const [rideStatus, setRideStatus] = useState<'arriving' | 'arrived' | 'in_progress' | 'completed'>(
        (initialStatus as any) || 'arriving'
    );
    const [statusLabel, setStatusLabel] = useState(() => {
        if (initialStatus === 'arrived') return 'Driver has arrived!';
        if (initialStatus === 'in_progress') return 'Heading to Destination';
        if (initialStatus === 'completed') return 'Ride completed!';
        return 'Driver is on the way';
    });
    const [driverHeading, setDriverHeading] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    const [showSafetyToolkit, setShowSafetyToolkit] = useState(false);
    const [rideSummary, setRideSummary] = useState<any>(null);

    const fetchRouteToPickup = async (dLat: number, dLng: number) => {
        // No longer needed as we use MapViewDirections component
    };

    useEffect(() => {
        // Real-time driver location updates
        socketService.on('driver:location_update', (data: any) => {
            if (data?.lat && data?.lng) {
                const lat = data.lat;
                const lng = data.lng;

                setDriverLocation({ latitude: lat, longitude: lng });
                setDriverHeading(data.heading || 0);

                (driverAnim as any).timing({
                    latitude: lat,
                    longitude: lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                    duration: 2000,
                }).start();

                // Fetch route to pickup (throttled to every 10 seconds)
                const now = Date.now();
                if (now - lastRouteFetch.current > 10000 && pickup) {
                    lastRouteFetch.current = now;
                    fetchRouteToPickup(lat, lng);
                }

                // Keep camera centered on driver
                mapRef.current?.animateToRegion({
                    latitude: lat,
                    longitude: lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }, 1000);
            }
        });

        // Consolidated Ride Lifecycle Listeners
        socketService.on('ride-matched', (data: any) => {
            setRideStatus('arriving');
            setStatusLabel('Driver is on the way!');
        });

        socketService.on('ride-status-update', (data: any) => {
            console.log('🔄 [Customer/ActiveRide] ride-status-update received:', JSON.stringify(data));
            if (data.status === 'cancelled') {
                Alert.alert('Ride Cancelled', 'The driver has cancelled the ride.');
                navigation.replace('Home');
                return;
            }
            if (data.status === 'arrived') {
                setRideStatus('arrived');
                setStatusLabel('Driver has arrived!');
            } else if (data.status === 'in_progress') {
                setRideStatus('in_progress');
                setStatusLabel('Heading to Destination');
            } else if (data.status === 'completed') {
                setRideStatus('completed');
                setStatusLabel('Ride completed!');
                setRideSummary(data);
                setShowSummary(true);
            }
        });

        socketService.on('ride-completed', (data: any) => {
            console.log('🏁 [Customer] Ride Completed:', data);
            setRideStatus('completed');
            setStatusLabel('Ride completed!');
            setRideSummary(data);
            setShowSummary(true);
        });

        socketService.on('payment-confirmed', () => {
            console.log('💳 [Customer] Payment Confirmed');
            setShowSummary(false);
            navigation.replace('RateDriver', {
                rideId,
                driver,
                estimatedFare: rideSummary?.finalFare || estimatedFare
            });
        });

        return () => {
            socketService.off('driver:location_update');
            socketService.off('ride-status-update');
            socketService.off('ride-matched');
            socketService.off('ride-completed');
            socketService.off('payment-confirmed');
        };
    }, []);

    const handleCallDriver = () => {
        if (driver?.phoneNumber) {
            Linking.openURL(`tel:${driver.phoneNumber}`);
        } else if (driver?.phone) {
            Linking.openURL(`tel:${driver.phone}`);
        } else {
            Alert.alert('Unable to call', 'Driver phone number is not available.');
        }
    };

    const handleTextDriver = () => {
        if (driver?.phoneNumber) {
            Linking.openURL(`sms:${driver.phoneNumber}`);
        } else if (driver?.phone) {
            Linking.openURL(`sms:${driver.phone}`);
        } else {
            Alert.alert('Unable to message', 'Driver phone number is not available.');
        }
    };

    const isDarkTheme = colors.mapStyle.toString() === 'dark';


    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle="dark-content" />

            {/* Map */}
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                customMapStyle={isDarkTheme ? darkMapStyle : lightMapStyle}
                showsUserLocation={true}
                initialRegion={{
                    latitude: driverLocation?.latitude || pickup?.lat || 0,
                    longitude: driverLocation?.longitude || pickup?.lng || 0,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
            >
                {pickup && dropoff && (
                    <MapViewDirections
                        origin={
                            driverLocation
                                ? { latitude: driverLocation.latitude, longitude: driverLocation.longitude }
                                : { latitude: pickup.lat || pickup.latitude, longitude: pickup.lng || pickup.longitude }
                        }
                        destination={
                            (rideStatus === 'in_progress')
                                ? { latitude: dropoff.lat || dropoff.latitude, longitude: dropoff.lng || dropoff.longitude }
                                : { latitude: pickup.lat || pickup.latitude, longitude: pickup.lng || pickup.longitude }
                        }
                        apikey={GOOGLE_MAPS_API_KEY}
                        strokeWidth={4}
                        strokeColor={colors.primary}
                        onReady={(result) => {
                            mapRef.current?.fitToCoordinates(result.coordinates, {
                                edgePadding: { top: 100, right: 50, bottom: 250, left: 50 },
                                animated: true,
                            });
                        }}
                        onError={(err) => console.log('[ActiveRide] MapViewDirections error:', err)}
                    />
                )}
                {/* Car marker — always visible; animates to real location once we receive updates */}
                <Marker.Animated
                    coordinate={driverAnim as any}
                    anchor={{ x: 0.5, y: 0.5 }}
                    flat={true}
                    rotation={driverHeading}
                >
                    <Image
                        source={carMarkerImg}
                        style={{ width: 40, height: 80, resizeMode: 'contain' }}
                    />
                </Marker.Animated>

                {/* Pickup (customer) pin */}
                {pickup && (
                    <Marker
                        coordinate={{ latitude: pickup.lat || pickup.latitude, longitude: pickup.lng || pickup.longitude }}
                        title="Pickup"
                    >
                        <View style={styles.pinContainer}>
                            <View style={[styles.pinBubble, { backgroundColor: colors.success }]}>
                                <Text style={styles.pinEmoji}>🧍</Text>
                            </View>
                            <View style={[styles.pinTail, { borderTopColor: colors.success }]} />
                        </View>
                    </Marker>
                )}

                {/* Dropoff pin */}
                {dropoff && (
                    <Marker
                        coordinate={{ latitude: dropoff.lat || dropoff.latitude, longitude: dropoff.lng || dropoff.longitude }}
                        title="Dropoff"
                    >
                        <View style={styles.pinContainer}>
                            <View style={[styles.pinBubble, { backgroundColor: colors.primary }]}>
                                <Text style={styles.pinEmoji}>📍</Text>
                            </View>
                            <View style={[styles.pinTail, { borderTopColor: colors.primary }]} />
                        </View>
                    </Marker>
                )}
            </MapView>

            {/* Driver info card */}
            <SafeAreaView style={[styles.infoCard, { backgroundColor: colors.backgroundCard, shadowColor: colors.shadow, paddingBottom: insets.bottom || 20 }]}>
                {/* Status pill */}
                <View style={[styles.statusPill, { backgroundColor: rideStatus === 'completed' ? colors.success + '20' : colors.primary + '15' }]}>
                    <Text style={{ color: rideStatus === 'completed' ? colors.success : colors.primary, fontWeight: '700', fontSize: fontSizes.sm }}>
                        {statusLabel}
                    </Text>
                </View>

                {/* Driver details */}
                {driver && (
                    <View style={styles.driverRow}>
                        <View style={[styles.driverAvatar, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={{ fontSize: 28 }}>👤</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={[styles.driverName, { color: colors.textPrimary }]}>{driver.name}</Text>
                            <Text style={{ color: colors.textSecondary, fontSize: fontSizes.sm }}>
                                ⭐ {driver.rating} · {driver.vehicleMake} {driver.vehicleModel}
                            </Text>
                            <Text style={{ color: colors.textTertiary, fontSize: fontSizes.sm }}>{driver.plateNumber}</Text>
                        </View>

                        {/* Action buttons */}
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: colors.backgroundHover }]}
                                onPress={handleCallDriver}
                            >
                                <PhoneIcon size={18} color={colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: colors.backgroundHover }]}
                                onPress={handleTextDriver}
                            >
                                <MessageCircle size={18} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Payment summary */}
                <View style={[styles.feeRow, { borderTopColor: colors.border }]}>
                    <Text style={{ color: colors.textSecondary, fontSize: fontSizes.sm }}>Estimated fare</Text>
                    <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: fontSizes.lg }}>
                        KES {estimatedFare || '---'} · {paymentMethod === 'mpesa' ? '📱 M-Pesa' : '💵 Cash'}
                    </Text>
                </View>

                {/* Safety button */}
                <TouchableOpacity
                    style={[styles.safetyBtn, { backgroundColor: colors.error + '10', borderColor: colors.error + '30' }]}
                    onPress={() => setShowSafetyToolkit(true)}
                >
                    <Shield size={16} color={colors.error} />
                    <Text style={{ color: colors.error, fontWeight: '700', marginLeft: 8, fontSize: fontSizes.sm }}>Safety Toolkit</Text>
                </TouchableOpacity>

                <SafetyToolkitModal
                    visible={showSafetyToolkit}
                    onClose={() => setShowSafetyToolkit(false)}
                    rideId={rideId}
                    pickup={pickup}
                    dropoff={dropoff}
                    driver={driver}
                />
            </SafeAreaView>

            {/* Summary Modal */}
            <PremiumModal
                visible={showSummary}
                onClose={() => setShowSummary(false)}
                title="Trip Summary"
                heightPercentage={0.7}
            >
                <View style={styles.summaryBody}>
                    <Text style={[styles.summaryGreetings, { color: colors.textPrimary }]}>Thank you for riding with Fikishwa!</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Distance</Text>
                            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{rideSummary?.actualDistanceKm || '5.2'} km</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Duration</Text>
                            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{rideSummary?.actualDurationMin || '12'} min</Text>
                        </View>
                    </View>

                    <View style={[styles.fareBreakdown, { borderTopColor: colors.border }]}>
                        <View style={styles.fareRow}>
                            <Text style={{ color: colors.textSecondary }}>Trip Fare</Text>
                            <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>KES {rideSummary?.finalFare || estimatedFare}</Text>
                        </View>
                        <View style={[styles.fareRow, { marginTop: 12 }]}>
                            <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 18 }}>Total Paid</Text>
                            <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 22 }}>KES {rideSummary?.finalFare || estimatedFare}</Text>
                        </View>
                    </View>

                    <View style={[styles.waitingBox, { backgroundColor: colors.backgroundHover }]}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={[styles.waitingText, { color: colors.textSecondary }]}>Waiting for driver to confirm payment...</Text>
                    </View>
                </View>
            </PremiumModal>
        </View>
    );
};

const styles = StyleSheet.create({
    map: { flex: 1 },
    markerDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
    pinContainer: { alignItems: 'center' },
    pinBubble: {
        width: 36, height: 36, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#fff',
        shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
    },
    pinEmoji: { fontSize: 18 },
    pinTail: {
        width: 0, height: 0,
        borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
    },
    infoCard: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 20, paddingBottom: 36,
        shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 16,
    },
    statusPill: {
        alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 8,
        borderRadius: 999, marginBottom: 16,
    },
    driverRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    driverAvatar: {
        width: 56, height: 56, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
    },
    driverName: { fontWeight: '800', fontSize: 16, marginBottom: 3 },
    actionButtons: { gap: 8 },
    actionBtn: {
        width: 40, height: 40, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    feeRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 14, borderTopWidth: 1, marginBottom: 12,
    },
    safetyBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, borderRadius: 14, borderWidth: 1,
    },
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center', alignItems: 'center', padding: 20
    },
    summaryContent: {
        width: '100%', borderRadius: 24, overflow: 'hidden'
    },
    summaryHeader: {
        padding: 24, alignItems: 'center'
    },
    summaryTitle: {
        color: '#fff', fontSize: 20, fontWeight: '800'
    },
    summaryBody: {
        padding: 24
    },
    summaryGreetings: {
        fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 24
    },
    statsRow: {
        flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24
    },
    statItem: {
        alignItems: 'center'
    },
    statLabel: {
        fontSize: 12, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1
    },
    statValue: {
        fontSize: 18, fontWeight: '800'
    },
    fareBreakdown: {
        borderTopWidth: 1, paddingTop: 20, marginBottom: 24
    },
    fareRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    waitingBox: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        padding: 16, borderRadius: 16, gap: 12
    },
    waitingText: {
        fontSize: 13, fontWeight: '600'
    }
});

export default ActiveRideScreen;
