import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Animated, StatusBar, Alert, Modal, Image, ActivityIndicator, Linking
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { socketService } from '../../services/socketService';
import api from '../../services/api';
import customerApiService from '../../services/customerApiService';
import { API_ENDPOINTS } from '../../config/api';
import { X, ChevronRight, Navigation, Star, MapPin, Phone, Clock, Wallet, CheckCircle, Car } from 'lucide-react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { darkMapStyle, lightMapStyle } from '../../theme/mapStyles';
import { decodePolyline } from '../../utils/polyline';
import { GOOGLE_MAPS_API_KEY } from '../../config/googleMaps';
import PremiumModal from '../../components/PremiumModal';
import PremiumAlert from '../../components/PremiumAlert';
const carMarkerImg = require('../../assets/images/car_marker.png');

const CANCELLATION_REASONS = [
    'Wait time too long',
    'Driver too far',
    'Changed my mind',
    'Found another ride',
    'Other',
];

/**
 * Calculate the bearing between two points in degrees (0 = North, 90 = East)
 */
const calculateHeading = (start: { latitude: number, longitude: number }, end: { latitude: number, longitude: number }) => {
    if (!start || !end) return 0;
    const lat1 = start.latitude * (Math.PI / 180);
    const lon1 = start.longitude * (Math.PI / 180);
    const lat2 = end.latitude * (Math.PI / 180);
    const lon2 = end.longitude * (Math.PI / 180);

    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    const brng = Math.atan2(y, x) * (180 / Math.PI);
    return (brng + 360) % 360;
};

const MatchingScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { rideId, pickup, dropoff, rideType, paymentMethod, estimatedFare, distanceKm = '0', durationMin = 0 } = route.params;
    const { colors, fontSizes, spacing, insets } = useTheme();

    const progressAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pulseOpacity = useRef(new Animated.Value(0.8)).current;
    const [statusText, setStatusText] = useState('Finding your driver...');
    const [showReasons, setShowReasons] = useState(false);
    const [selectingReason, setSelectingReason] = useState(false);
    const [showDriverDetails, setShowDriverDetails] = useState(false);
    const [driverData, setDriverData] = useState<any>(null);
    const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string; buttons?: any[] }>({ visible: false, title: '', message: '' });
    const latestStatusRef = useRef<string>('searching');
    const mapRef = useRef<MapView>(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [driverRouteCoords, setDriverRouteCoords] = useState<any[]>([]);
    const matchedDriverIdRef = useRef<string | null>(null);   // tracks accepted driver ID
    const locationUpdateCount = useRef(0);                     // rate-limits route re-fetch

    // Pulsing progress bar animation
    useEffect(() => {
        Animated.loop(
            Animated.timing(progressAnim, { toValue: 1, duration: 2000, useNativeDriver: false })
        ).start();
    }, []);

    // Pulsing pin animation
    useEffect(() => {
        Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 2.5, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                ]),
                Animated.sequence([
                    Animated.timing(pulseOpacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseOpacity, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
                ]),
            ])
        ).start();
    }, []);

    const handleProceedToRide = (status?: string) => {
        navigation.replace('ActiveRide', {
            rideId,
            pickup,
            dropoff,
            paymentMethod,
            estimatedFare,
            driver: driverData,
            initialStatus: status || latestStatusRef.current,
            initialDriverLocation: driverData?.location
                ? { latitude: Number(driverData.location.lat), longitude: Number(driverData.location.lng) }
                : null,
            initialRouteCoords: driverRouteCoords.length > 0 ? driverRouteCoords : null,
        });
    };

    const confirmCancellation = async (reason: string) => {
        setSelectingReason(true);
        try {
            console.log(`[Matching] Canceling ride ${rideId} with reason: ${reason}`);
            await customerApiService.cancelRide(rideId, reason);
            setShowReasons(false);
            navigation.replace('Home');
        } catch (error: any) {
            console.error('[Matching] Cancel error:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to cancel ride. Please try again.');
        } finally {
            setSelectingReason(false);
        }
    };

    const handleCancel = () => {
        setShowReasons(true);
    };

    /**
     * Fetch the driving route from the driver's current location to the customer pickup point.
     */
    const fetchDriverRoute = async (driverLat: number, driverLng: number) => {
        if (!pickup) return;
        try {
            const url =
                `https://maps.googleapis.com/maps/api/directions/json` +
                `?origin=${driverLat},${driverLng}` +
                `&destination=${Number(pickup.lat)},${Number(pickup.lng)}` +
                `&mode=driving` +
                `&key=${GOOGLE_MAPS_API_KEY}`;

            const res = await fetch(url);
            const json = await res.json();
            if (json.status === 'OK' && json.routes?.length > 0) {
                const polyline = json.routes[0].overview_polyline?.points;
                if (polyline) {
                    const coords = decodePolyline(polyline);
                    console.log('[Matching] Driver route decoded, points:', coords.length);
                    setDriverRouteCoords(coords);
                }
            } else {
                console.warn('[Matching] Directions API returned:', json.status);
            }
        } catch (err) {
            console.warn('[Matching] Failed to fetch driver route:', err);
        }
    };

    const fitMapToDriversAndPickup = (drivers: any[]) => {
        if (!mapRef.current || !pickup || !isMapReady) return;

        console.log('[Matching] Fitting map to pickup and', drivers.length, 'drivers');

        const points = [
            { latitude: Number(pickup.lat), longitude: Number(pickup.lng) }
        ];

        drivers.forEach(d => {
            if (d.location?.lat && d.location?.lng) {
                points.push({
                    latitude: Number(d.location.lat),
                    longitude: Number(d.location.lng)
                });
            }
        });

        if (points.length > 1) {
            mapRef.current.fitToCoordinates(points, {
                edgePadding: { top: 100, right: 100, bottom: 350, left: 100 },
                animated: true
            });
        } else {
            // If only pickup, zoom to it
            mapRef.current.animateToRegion({
                latitude: Number(pickup.lat),
                longitude: Number(pickup.lng),
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            }, 1000);
        }
    };

    // Listen for driver accepted and status updates
    useEffect(() => {
        let redirectTimer: any = null;

        const fetchInitialDrivers = async () => {
            try {
                const response = await customerApiService.getAvailableDrivers();
                if (response.data?.success && Array.isArray(response.data.drivers)) {
                    console.log('[Matching] Initial drivers fetch:', response.data.drivers.length);
                    setAvailableDrivers(response.data.drivers);
                    if (isMapReady) fitMapToDriversAndPickup(response.data.drivers);
                }
            } catch (err) {
                console.log('[Matching] Initial drivers fetch error:', err);
            }
        };

        fetchInitialDrivers();

        const handleAccepted = (data: any) => {
            console.log('🚕 [Matching] Ride accepted:', JSON.stringify(data));
            const driver = data.driver || data.ride?.driver || data.driverDetails;
            const driverId = data.driverId || data.ride?.driverId || driver?.driverId;

            // Store accepted driver ID so handleDrivers can track their movements
            if (driverId) {
                matchedDriverIdRef.current = driverId;
                locationUpdateCount.current = 0;
            }

            setDriverData(driver);
            setStatusText('Driver found!');
            setShowDriverDetails(true);

            const findAndRoute = async () => {
                // Primary: driverLocation is now embedded directly in the event payload
                let loc = data.driverLocation;

                // Fallback 1: look in the availableDrivers state list
                if (!loc?.lat && driverId) {
                    const found = availableDrivers.find(
                        d => (d.driverId || d.id || d._id) === driverId
                    );
                    if (found?.location?.lat) {
                        loc = found.location;
                        console.log('[Matching] Location from availableDrivers list');
                    }
                }

                // Fallback 2: HTTP endpoint
                if (!loc?.lat && driverId) {
                    try {
                        const resp = await customerApiService.getAvailableDrivers();
                        const found = (resp.data?.drivers || []).find(
                            (d: any) => (d.driverId || d.id || d._id) === driverId
                        );
                        if (found?.location?.lat) {
                            loc = found.location;
                            console.log('[Matching] Location from HTTP fallback');
                        }
                    } catch (e) {
                        console.warn('[Matching] HTTP fallback failed:', e);
                    }
                }

                if (loc?.lat && loc?.lng) {
                    const driverLat = Number(loc.lat);
                    const driverLng = Number(loc.lng);
                    console.log('[Matching] Drawing route from', driverLat, driverLng, '→ pickup');

                    // Attach location to driverData for the car marker
                    setDriverData((prev: any) => ({ ...prev, location: { lat: driverLat, lng: driverLng } }));
                    fetchDriverRoute(driverLat, driverLng);

                    if (mapRef.current && pickup && isMapReady) {
                        mapRef.current.fitToCoordinates([
                            { latitude: Number(pickup.lat), longitude: Number(pickup.lng) },
                            { latitude: driverLat, longitude: driverLng }
                        ], { edgePadding: { top: 100, right: 100, bottom: 400, left: 100 }, animated: true });
                    }
                } else {
                    console.warn('[Matching] No driver location found — skipping route');
                    if (mapRef.current && pickup && isMapReady) {
                        mapRef.current.animateToRegion({
                            latitude: Number(pickup.lat), longitude: Number(pickup.lng),
                            latitudeDelta: 0.015, longitudeDelta: 0.015,
                        }, 1000);
                    }
                }
            };

            findAndRoute();
        };

        const handleStatusUpdate = (data: any) => {
            console.log('🔄 [Matching] Status update received:', data.status);
            if (data.status) latestStatusRef.current = data.status;

            if (data.status === 'cancelled') {
                if (redirectTimer) clearTimeout(redirectTimer);
                const cancelledByCustomer = data.cancelledBy === 'customer';
                const cancelMsg = cancelledByCustomer
                    ? 'You have successfully cancelled this ride.'
                    : 'The driver has cancelled the ride.';
                Alert.alert('Ride Cancelled', cancelMsg);
                navigation.replace('Home');
                return;
            }
            if (data.status === 'cancelled_no_drivers') {
                if (redirectTimer) clearTimeout(redirectTimer);
                setAlertConfig({
                    visible: true,
                    title: 'Oops..! Driver not found',
                    message: 'Please call the Fikishwa dispatch on 0700709709 if you require urgent assistance.',
                    buttons: [
                        {
                            text: 'TRY LATER',
                            style: 'cancel',
                            onPress: () => {
                                setAlertConfig(prev => ({ ...prev, visible: false }));
                                navigation.replace('Home');
                            }
                        },
                        {
                            text: 'CANCEL',
                            style: 'destructive',
                            onPress: () => {
                                setAlertConfig(prev => ({ ...prev, visible: false }));
                                navigation.replace('Home');
                            }
                        }
                    ]
                });
                return;
            }

            if (data.status !== 'accepted' && data.status !== 'searching') {
                if (redirectTimer) clearTimeout(redirectTimer);
                handleProceedToRide(data.status);
            }
        };

        const handleDrivers = (drivers: any[]) => {
            if (!Array.isArray(drivers)) return;

            if (matchedDriverIdRef.current) {
                // Ride matched: track only the accepted driver
                const matched = drivers.find(
                    d => (d.driverId || d.id || d._id) === matchedDriverIdRef.current
                );
                if (matched?.location?.lat && matched?.location?.lng) {
                    const lat = Number(matched.location.lat);
                    const lng = Number(matched.location.lng);

                    // Determine car rotation aligned with polyline route
                    let rotation = matched.location.heading || 0;
                    if (driverRouteCoords.length > 0) {
                        // Find the point in the polyline closest to the driver's current position
                        // and use the angle towards the next point in the line.
                        // Simple approach: rotate towards the first point in the list that is far enough.
                        const nextPoint = driverRouteCoords.find(p => {
                            const dist = Math.sqrt(Math.pow(p.latitude - lat, 2) + Math.pow(p.longitude - lng, 2));
                            return dist > 0.0001; // aprox ~10 meters
                        });
                        if (nextPoint) {
                            rotation = calculateHeading({ latitude: lat, longitude: lng }, nextPoint);
                        }
                    }

                    // Move the car marker
                    setDriverData((prev: any) => prev
                        ? { ...prev, location: { lat, lng, heading: rotation } }
                        : prev
                    );

                    // Refresh route every 5 location updates
                    locationUpdateCount.current += 1;
                    if (locationUpdateCount.current % 5 === 0) {
                        fetchDriverRoute(lat, lng);
                    }
                }
            } else {
                // Still searching: update nearby drivers list and re-fit map
                setAvailableDrivers(drivers);
                if (isMapReady) fitMapToDriversAndPickup(drivers);
            }
        };

        socketService.on('ride:accepted', handleAccepted);
        socketService.on('ride-accepted', handleAccepted);
        socketService.on('ride-matched', handleAccepted);
        socketService.on('ride-status-update', handleStatusUpdate);
        socketService.on('available-drivers', handleDrivers);

        return () => {
            if (redirectTimer) clearTimeout(redirectTimer);
            socketService.off('ride:accepted');
            socketService.off('ride-accepted');
            socketService.off('ride-matched');
            socketService.off('ride-status-update');
            socketService.off('available-drivers');
        };
    }, [driverData, rideId, isMapReady]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={StyleSheet.absoluteFillObject}
                customMapStyle={colors.mapStyle.toString() === 'dark' ? darkMapStyle : lightMapStyle}
                onMapReady={() => {
                    console.log('[Matching] Map Ready');
                    setIsMapReady(true);
                    if (availableDrivers.length > 0) {
                        fitMapToDriversAndPickup(availableDrivers);
                    }
                }}
                initialRegion={{
                    latitude: Number(pickup?.lat || -1.286389),
                    longitude: Number(pickup?.lng || 36.817223),
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }}
            >
                {/* Simplified Route Rendering for this screen using just markers to keep it clean */}
                {pickup && (
                    <Marker
                        coordinate={{ latitude: Number(pickup.lat), longitude: Number(pickup.lng) }}
                        anchor={{ x: 0.5, y: 0.5 }}
                        tracksViewChanges={true}
                    >
                        <View style={styles.customerPinContainer}>
                            {/* Outer pulse ring */}
                            <Animated.View
                                style={[
                                    styles.customerPinPulse,
                                    {
                                        backgroundColor: colors.success,
                                        transform: [{ scale: pulseAnim }],
                                        opacity: pulseOpacity,
                                    }
                                ]}
                            />
                            {/* Inner solid dot */}
                            <View style={[styles.customerPinCore, { backgroundColor: colors.success }]}>
                                <View style={styles.customerPinInner} />
                            </View>
                        </View>
                    </Marker>
                )}

                {dropoff && (
                    <Marker coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }}>
                        <View style={[styles.mapPin, { backgroundColor: colors.primary }]}>
                            <View style={styles.mapPinInner} />
                        </View>
                    </Marker>
                )}

                {/* Nearby Drivers (shown while searching) */}
                {!driverData && availableDrivers.map((driver) => {
                    const id = driver.driverId || driver.id || driver._id;
                    const loc = driver.location;
                    if (!loc || !loc.lat || !loc.lng) return null;

                    return (
                        <Marker
                            key={id}
                            coordinate={{ latitude: loc.lat, longitude: loc.lng }}
                            anchor={{ x: 0.5, y: 0.5 }}
                            flat={true}
                            rotation={loc.heading || 0}
                        >
                            <Image
                                source={carMarkerImg}
                                style={{ width: 15, height: 30, resizeMode: 'contain' }}
                            />
                        </Marker>
                    );
                })}

                {/* Accepted Driver - car marker at driver location */}
                {driverData?.location?.lat && driverData?.location?.lng && (
                    <Marker
                        coordinate={{
                            latitude: Number(driverData.location.lat),
                            longitude: Number(driverData.location.lng),
                        }}
                        anchor={{ x: 0.5, y: 0.5 }}
                        flat={true}
                        rotation={driverData.location.heading || 0}
                        tracksViewChanges={false}
                    >
                        <Image
                            source={carMarkerImg}
                            style={{ width: 22, height: 44, resizeMode: 'contain' }}
                        />
                    </Marker>
                )}

                {/* Route polyline from driver to pickup */}
                {driverData && driverRouteCoords.length > 0 && (
                    <Polyline
                        coordinates={driverRouteCoords}
                        strokeColor={colors.primary}
                        strokeWidth={4}
                        lineDashPattern={[8, 4]}
                    />
                )}
            </MapView>

            {/* Trip Pill */}
            <View style={[styles.tripPill, { top: (insets?.top || 40) + 16, backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.tripPillText, { color: colors.primary }]}>
                    Trip #{rideId?.substring(0, 7).toUpperCase()}
                </Text>
            </View>

            {/* Cancellation Reasons Modal */}
            {/* Cancellation Reasons Modal */}
            <PremiumModal
                visible={showReasons}
                onClose={() => setShowReasons(false)}
                title="Why are you canceling?"
                heightPercentage={0.6}
            >
                <View style={styles.reasonsList}>
                    {CANCELLATION_REASONS.map((reason) => (
                        <TouchableOpacity
                            key={reason}
                            style={[styles.reasonItem, { borderBottomColor: colors.border }]}
                            onPress={() => confirmCancellation(reason)}
                            disabled={selectingReason}
                        >
                            <Text style={[styles.reasonText, { color: colors.textPrimary, fontSize: fontSizes.md }]}>
                                {reason}
                            </Text>
                            <ChevronRight size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.closeBtn, { backgroundColor: colors.backgroundHover }]}
                    onPress={() => setShowReasons(false)}
                >
                    <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Keep Ride</Text>
                </TouchableOpacity>
            </PremiumModal>

            {/* Driver Details Bottom Sheet (replaces the modal) */}
            {showDriverDetails && (
                <View style={[styles.fixedBottomContainer, { paddingBottom: insets.bottom || 20 }]}>
                    <View style={[styles.driverDetailsCardBS, { backgroundColor: colors.backgroundCard }]}>
                        {/* Pull handle */}
                        <View style={styles.modalHandle} />

                        <View style={styles.driverMainRow}>
                            <View style={[styles.driverAvatarSmall, { backgroundColor: colors.primary + '20' }]}>
                                {driverData?.profilePhotoUrl || driverData?.profileImage ? (
                                    <Image
                                        source={{ uri: driverData?.profilePhotoUrl || driverData?.profileImage }}
                                        style={styles.avatarImage}
                                    />
                                ) : (
                                    <Text style={{ fontSize: 32 }}>👤</Text>
                                )}
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[styles.driverNameBS, { color: colors.textPrimary }]}>
                                    {driverData?.name || 'Driver'}
                                </Text>
                                <View style={styles.ratingRowBS}>
                                    <Star size={14} color="#FFB800" fill="#FFB800" />
                                    <Text style={[styles.ratingTextBS, { color: colors.textSecondary }]}>
                                        {driverData?.rating || '4.8'} · {driverData?.plateNumber}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.vehicleInfoBS}>
                                <Text style={[styles.vehicleModelBS, { color: colors.textPrimary }]}>
                                    {driverData?.vehicleModel}
                                </Text>
                                <Text style={[styles.vehicleColorBS, { color: colors.textTertiary }]}>
                                    {driverData?.vehicleColor || 'White'}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 16 }]} />

                        <View style={styles.detailsGridBS}>
                            <View style={styles.detailItemBS}>
                                <Clock size={18} color={colors.primary} />
                                <Text style={[styles.detailValueBS, { color: colors.textPrimary }]}>
                                    {driverData?.eta || '2'} min
                                </Text>
                                <Text style={[styles.detailLabelBS, { color: colors.textTertiary }]}>ETA</Text>
                            </View>
                            <View style={styles.detailItemBS}>
                                <MapPin size={18} color={colors.success} />
                                <Text style={[styles.detailValueBS, { color: colors.textPrimary }]}>
                                    {driverData?.distance || '0.5'} km
                                </Text>
                                <Text style={[styles.detailLabelBS, { color: colors.textTertiary }]}>Distance</Text>
                            </View>
                            <View style={styles.detailItemBS}>
                                <Wallet size={18} color={colors.warning} />
                                <Text style={[styles.detailValueBS, { color: colors.textPrimary }]}>
                                    {paymentMethod === 'cash' ? 'Cash' : 'M-Pesa'}
                                </Text>
                                <Text style={[styles.detailLabelBS, { color: colors.textTertiary }]}>Payment</Text>
                            </View>
                        </View>

                        <View style={styles.actionRowBS}>
                            <TouchableOpacity
                                style={[styles.contactBtnBS, { backgroundColor: colors.success + '15' }]}
                                onPress={() => {
                                    const phone = driverData?.phone || driverData?.phoneNumber;
                                    if (phone && phone !== 'N/A') {
                                        Linking.openURL(`tel:${phone}`);
                                    } else {
                                        Alert.alert('Error', 'Phone not available');
                                    }
                                }}
                            >
                                <Phone size={20} color={colors.success} />
                                <Text style={[styles.contactBtnTextBS, { color: colors.success }]}>Call</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.proceedBtnBS, { backgroundColor: colors.primary }]}
                                onPress={() => handleProceedToRide()}
                            >
                                <Text style={styles.proceedBtnTextBS}>Continue</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Main Bottom Sheet (Finding Ride Layer) */}
            {!showDriverDetails && (
                <View style={[styles.bottomSheet, { backgroundColor: colors.backgroundCard, paddingBottom: (insets?.bottom || 20) + 20 }]}>

                    {/* Meta Row (Time and Distance) */}
                    <View style={styles.metaRow}>
                        <View style={styles.metaPill}>
                            <Clock size={16} color={colors.textSecondary} />
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>Est. Time : {Number(durationMin).toFixed(1)} min(s)</Text>
                        </View>
                        <View style={styles.metaPill}>
                            <MapPin size={16} color={colors.textSecondary} />
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>Distance : {distanceKm} km(s)</Text>
                        </View>
                    </View>

                    {/* Finding Title & Sub */}
                    <Text style={[styles.titleText, { color: colors.textPrimary }]}>Finding Ride</Text>
                    <Text style={[styles.subText, { color: colors.textSecondary }]}>Searching for driver....</Text>

                    {/* Progress Bar */}
                    <View style={[styles.progressContainer, { backgroundColor: colors.border }]}>
                        <Animated.View style={[
                            styles.progressFill,
                            { backgroundColor: colors.primary, width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }
                        ]} />
                    </View>

                    {/* Route Timeline */}
                    <View style={[styles.timelineBox, { backgroundColor: colors.backgroundHover }]}>
                        <View style={styles.timelineColLeft}>
                            <View style={[styles.dotCircle, { backgroundColor: colors.success + '20' }]}>
                                <View style={[styles.dotInner, { backgroundColor: colors.success }]} />
                            </View>
                            <View style={styles.timelineDash} />
                            <View style={[styles.dotCircle, { backgroundColor: colors.primary + '20' }]}>
                                <View style={[styles.squareInner, { backgroundColor: colors.primary }]} />
                            </View>
                        </View>
                        <View style={styles.timelineColRight}>
                            <Text style={[styles.timelineAddress, { color: colors.textPrimary }]} numberOfLines={1}>{pickup?.address || 'Pickup'}</Text>
                            <View style={{ height: 28 }} />
                            <Text style={[styles.timelineAddress, { color: colors.textPrimary }]} numberOfLines={1}>{dropoff?.address || 'Dropoff'}</Text>
                        </View>
                    </View>

                    {/* Payment Breakdown Line */}
                    <View style={[styles.paymentRow, { borderTopColor: colors.border }]}>
                        <View style={styles.paymentLeft}>
                            <Wallet size={20} color={colors.textSecondary} />
                            <Text style={[styles.paymentMethodLabel, { color: colors.textPrimary }]}>Payment Method:</Text>
                        </View>
                        <TouchableOpacity style={styles.paymentRight}>
                            <Text style={[styles.paymentMethodValue, { color: colors.textSecondary }]}>{paymentMethod === 'cash' ? 'Cash' : 'M-Pesa'}</Text>
                            <ChevronRight size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Cancel Button */}
                    <TouchableOpacity
                        style={[styles.cancelBtnOutline, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}
                        onPress={handleCancel}
                    >
                        <Text style={[styles.cancelBtnText, { color: colors.primary }]}>CANCEL TRIP</Text>
                    </TouchableOpacity>

                </View>
            )}

            {/* No Driver Found Alert */}
            <PremiumAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    mapPin: {
        width: 24, height: 24, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#fff',
        shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, elevation: 4,
    },
    mapPinInner: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff' },

    // Animated customer location pin
    customerPinContainer: {
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    customerPinPulse: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 15,
    },
    customerPinCore: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2.5,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    customerPinInner: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#fff',
    },

    tripPill: {
        position: 'absolute',
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        zIndex: 5,
    },
    tripPillText: { fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },

    bottomSheet: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 24,
        paddingHorizontal: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 15,
    },
    metaRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 },
    metaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    metaText: { fontSize: 12, fontWeight: '600' },

    titleText: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
    subText: { fontSize: 14, fontWeight: '500', textAlign: 'center', marginBottom: 20 },

    progressContainer: { height: 4, borderRadius: 2, width: '100%', marginBottom: 24, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 2 },

    timelineBox: { padding: 18, borderRadius: 16, flexDirection: 'row', marginBottom: 20 },
    timelineColLeft: { width: 24, alignItems: 'center' },
    timelineColRight: { flex: 1, paddingLeft: 12, justifyContent: 'space-between' },
    dotCircle: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    dotInner: { width: 8, height: 8, borderRadius: 4 },
    squareInner: { width: 8, height: 8, borderRadius: 2 },
    timelineDash: { width: 1, height: 28, backgroundColor: '#CBD5E1', marginVertical: 2, borderStyle: 'dotted', borderWidth: 1, borderColor: '#CBD5E1' },
    timelineAddress: { fontSize: 15, fontWeight: '600', marginTop: 1 },

    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 20 },
    divider: { height: 1, width: '100%' },

    paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginBottom: 24, borderTopWidth: 1 },
    paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    paymentMethodLabel: { fontSize: 15, fontWeight: '600' },
    paymentRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    paymentMethodValue: { fontSize: 15, fontWeight: '500' },

    cancelBtnOutline: { width: '100%', paddingVertical: 16, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    cancelBtnText: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

    // Modals
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
        zIndex: 10,
    },
    modalContent: {
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        padding: 24, paddingBottom: 40,
    },
    modalHeader: { marginBottom: 24 },
    modalTitle: { fontWeight: '800', marginBottom: 4 },
    modalSub: { fontWeight: '500' },
    reasonsList: { marginBottom: 24 },
    reasonItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 18, borderBottomWidth: 1,
    },
    reasonText: { fontWeight: '600' },
    closeBtn: { padding: 16, borderRadius: 16, alignItems: 'center', zIndex: 5 },

    // Driver Details Modal Styles
    driverModalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 10 },
    driverDetailsCard: { width: '100%', borderRadius: 28, padding: 28, alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8 },
    driverAvatarLarge: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 20, overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    driverNameLarge: { fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8 },
    ratingText: { fontSize: 14, fontWeight: '600' },
    vehicleCard: { padding: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 24, borderWidth: 1, gap: 12 },
    vehicleLabel: { fontSize: 13, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    vehicleDetail: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
    plateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    colorDot: { width: 10, height: 10, borderRadius: 5 },
    plateNumber: { fontSize: 15, fontWeight: '700', letterSpacing: 1 },
    carImg: { width: 100, height: 60 },
    carPlaceholder: { width: 80, height: 50, justifyContent: 'center', alignItems: 'center', opacity: 0.3 },
    detailsGrid: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 24, paddingVertical: 16 },
    detailItem: { alignItems: 'center', flex: 1 },
    detailIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    detailLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    detailValue: { fontSize: 14, fontWeight: '700' },
    contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: 16, borderRadius: 16, gap: 10, marginBottom: 12 },
    contactBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    proceedBtn: { width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    proceedBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    closeModalBtn: { width: '100%', paddingVertical: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

    // Bottom Sheet (BS) Styles for Driver Found
    fixedBottomContainer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        zIndex: 20,
    },
    driverDetailsCardBS: {
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        padding: 24, paddingBottom: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 15,
    },
    driverMainRow: { flexDirection: 'row', alignItems: 'center' },
    driverAvatarSmall: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    driverNameBS: { fontSize: 20, fontWeight: '800' },
    ratingRowBS: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
    ratingTextBS: { fontSize: 13, fontWeight: '600' },
    vehicleInfoBS: { alignItems: 'flex-end' },
    vehicleModelBS: { fontSize: 16, fontWeight: '700' },
    vehicleColorBS: { fontSize: 13, fontWeight: '500' },
    detailsGridBS: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    detailItemBS: { alignItems: 'center', flex: 1 },
    detailValueBS: { fontSize: 16, fontWeight: '800', marginTop: 6 },
    detailLabelBS: { fontSize: 11, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
    actionRowBS: { flexDirection: 'row', gap: 12 },
    contactBtnBS: { flex: 1, height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    contactBtnTextBS: { fontSize: 16, fontWeight: '800' },
    proceedBtnBS: { flex: 2, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    proceedBtnTextBS: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default MatchingScreen;
