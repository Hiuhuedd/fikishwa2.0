import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Animated, StatusBar, Alert, Modal, Image, ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { socketService } from '../../services/socketService';
import api from '../../services/api';
import customerApiService from '../../services/customerApiService';
import { API_ENDPOINTS } from '../../config/api';
import { X, ChevronRight, Navigation, Star, MapPin, Phone, Clock, Wallet, CheckCircle } from 'lucide-react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { darkMapStyle, lightMapStyle } from '../../theme/mapStyles';
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

const MatchingScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { rideId, pickup, dropoff, rideType, paymentMethod, estimatedFare, distanceKm = '0', durationMin = 0 } = route.params;
    const { colors, fontSizes, spacing, insets } = useTheme();

    const progressAnim = useRef(new Animated.Value(0)).current;
    const [statusText, setStatusText] = useState('Finding your driver...');
    const [showReasons, setShowReasons] = useState(false);
    const [selectingReason, setSelectingReason] = useState(false);
    const [showDriverDetails, setShowDriverDetails] = useState(false);
    const [driverData, setDriverData] = useState<any>(null);
    const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string; buttons?: any[] }>({ visible: false, title: '', message: '' });
    const latestStatusRef = useRef<string>('accepted'); // Track real-time status

    // Pulsing progress bar animation
    useEffect(() => {
        Animated.loop(
            Animated.timing(progressAnim, { toValue: 1, duration: 2000, useNativeDriver: false })
        ).start();
    }, []);

    // Listen for driver accepted and status updates
    useEffect(() => {
        let redirectTimer: any = null;

        const handleAccepted = (data: any) => {
            console.log('🚕 [Matching] Ride accepted event received:', JSON.stringify(data));
            const driver = data.driver || data.ride?.driver || data.driverDetails;
            console.log('🚕 [Matching] Extracted Driver Data:', JSON.stringify(driver));
            setDriverData(driver);
            setStatusText('Driver found!');
            setShowDriverDetails(true);

            // Auto-redirect after 5 seconds to ensure the user isn't stuck
            if (!redirectTimer) {
                redirectTimer = setTimeout(() => {
                    console.log('⏱️ [Matching] Auto-redirecting to ActiveRide...');
                    handleProceedToRide();
                }, 5000);
            }
        };

        const handleStatusUpdate = (data: any) => {
            console.log('🔄 [Matching] Status update received:', data.status);
            // Always track the latest status for when we navigate to ActiveRide
            if (data.status) latestStatusRef.current = data.status;

            if (data.status === 'cancelled') {
                if (redirectTimer) clearTimeout(redirectTimer);
                Alert.alert('Ride Cancelled', 'The driver has cancelled the ride.');
                navigation.replace('Home');
                return;
            }
            // If the status has moved past 'accepted', go to ActiveRide
            if (data.status !== 'accepted' && data.status !== 'searching') {
                if (redirectTimer) clearTimeout(redirectTimer);
                handleProceedToRide(data.status);
            }
        };

        const handleDrivers = (drivers: any[]) => {
            if (Array.isArray(drivers)) setAvailableDrivers(drivers);
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
    }, [driverData, rideId]); // Add dependencies for handleProceedToRide if needed, but it's a ref-stable usually. Wait, handleProceedToRide uses closure variables.

    const handleCancel = () => {
        setShowReasons(true);
    };

    const handleProceedToRide = (status?: string) => {
        navigation.replace('ActiveRide', {
            rideId,
            pickup,
            dropoff,
            paymentMethod,
            estimatedFare,
            driver: driverData,
            initialStatus: status || latestStatusRef.current,
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

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            <MapView
                provider={PROVIDER_GOOGLE}
                style={StyleSheet.absoluteFillObject}
                customMapStyle={colors.mapStyle.toString() === 'dark' ? darkMapStyle : lightMapStyle}
                initialRegion={{
                    latitude: (pickup.lat + dropoff.lat) / 2,
                    longitude: (pickup.lng + dropoff.lng) / 2,
                    latitudeDelta: Math.abs(pickup.lat - dropoff.lat) * 1.5 || 0.05,
                    longitudeDelta: Math.abs(pickup.lng - dropoff.lng) * 1.5 || 0.05,
                }}
            >
                {/* Simplified Route Rendering for this screen using just markers to keep it clean */}
                <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}>
                    <View style={[styles.mapPin, { backgroundColor: colors.success }]}>
                        <View style={styles.mapPinInner} />
                    </View>
                </Marker>

                <Marker coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }}>
                    <View style={[styles.mapPin, { backgroundColor: colors.primary }]}>
                        <View style={styles.mapPinInner} />
                    </View>
                </Marker>

                {/* Nearby Drivers */}
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

            {/* Driver Details Modal */}
            <Modal
                visible={showDriverDetails}
                transparent
                animationType="fade"
            >
                <View style={[styles.driverModalOverlay, { backgroundColor: colors.background }]}>
                    <View style={[styles.driverDetailsCard, { backgroundColor: colors.backgroundCard }]}>
                        <View style={[styles.driverAvatarLarge, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={{ fontSize: 64 }}>👤</Text>
                        </View>

                        <Text style={[styles.driverNameLarge, { color: colors.textPrimary }]}>
                            {driverData?.name || 'Driver'}
                        </Text>
                        <View style={styles.ratingRow}>
                            <Star size={16} color="#FFB800" fill="#FFB800" />
                            <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                                {driverData?.rating || '4.8'} · {driverData?.completedRides || 250} trips
                            </Text>
                        </View>

                        <View style={[styles.vehicleCard, { backgroundColor: colors.backgroundHover, borderColor: colors.border }]}>
                            <View>
                                <Text style={[styles.vehicleLabel, { color: colors.textTertiary }]}>Vehicle</Text>
                                <Text style={[styles.vehicleDetail, { color: colors.textPrimary }]}>
                                    {driverData?.vehicleMake} {driverData?.vehicleModel}
                                </Text>
                                <Text style={[styles.plateNumber, { color: colors.textSecondary }]}>
                                    {driverData?.plateNumber}
                                </Text>
                            </View>
                            <View style={[styles.vehicleColor, { backgroundColor: driverData?.vehicleColor || '#4CD964' }]} />
                        </View>

                        <View style={styles.detailsGrid}>
                            <View style={styles.detailItem}>
                                <View style={[styles.detailIcon, { backgroundColor: colors.primary + '10' }]}>
                                    <MapPin size={18} color={colors.primary} />
                                </View>
                                <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Location</Text>
                                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                                    {driverData?.distance ? `${driverData.distance} away` : '2 min away'}
                                </Text>
                            </View>

                            <View style={styles.detailItem}>
                                <View style={[styles.detailIcon, { backgroundColor: colors.success + '10' }]}>
                                    <Navigation size={18} color={colors.success} />
                                </View>
                                <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Status</Text>
                                <Text style={[styles.detailValue, { color: colors.success }]}>
                                    On the way
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.contactBtn, { backgroundColor: colors.primary }]}
                            onPress={() => Alert.alert('Call', `Calling ${driverData?.name || 'Driver'}...`)}
                        >
                            <Phone size={20} color="#fff" />
                            <Text style={styles.contactBtnText}>Call Driver</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.proceedBtn, { backgroundColor: colors.primary }]}
                            onPress={() => handleProceedToRide()}
                        >
                            <Text style={styles.proceedBtnText}>Continue to Pickup</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.closeModalBtn, { backgroundColor: colors.backgroundHover }]}
                            onPress={() => setShowDriverDetails(false)}
                        >
                            <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Back</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Main Bottom Sheet (Finding Ride Layer) */}
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
                        <Text style={[styles.timelineAddress, { color: colors.textPrimary }]} numberOfLines={1}>{pickup.address}</Text>
                        <View style={{ height: 28 }} />
                        <Text style={[styles.timelineAddress, { color: colors.textPrimary }]} numberOfLines={1}>{dropoff.address}</Text>
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    mapPin: {
        width: 14, height: 14, borderRadius: 7,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#fff',
        shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, elevation: 4,
    },
    mapPinInner: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff' },

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
    driverAvatarLarge: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    driverNameLarge: { fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8 },
    ratingText: { fontSize: 14, fontWeight: '600' },
    vehicleCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
    vehicleLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 },
    vehicleDetail: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
    plateNumber: { fontSize: 13, fontWeight: '600' },
    vehicleColor: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
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
});

export default MatchingScreen;
