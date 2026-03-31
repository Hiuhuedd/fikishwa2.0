import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Alert, ActivityIndicator, Modal, Image as RNImage } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Menu, User, Power, MapPin, Navigation, ShieldCheck, Gift, ChevronRight, X } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import driverApiService from '../../services/driverApiService';
import socketService from '../../services/socket';
import NewRequestOverlay from '../../components/NewRequestOverlay';
import RideMap from '../../components/RideMap';
import ActiveRidePhaseCard from '../../components/ActiveRidePhaseCard';
import RideInfoCard from '../../components/RideInfoCard';
import StatusHeader from '../../components/StatusHeader';
import OnlineToggleButton from '../../components/OnlineToggleButton';
import SidebarMenu from '../../components/SidebarMenu';
import PremiumModal from '../../components/PremiumModal';
import PremiumAlert from '../../components/PremiumAlert';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const GOOGLE_MAPS_APIKEY = "AIzaSyCTC78aB0ukv5ERXLwBM_tyiFIy13697wc";

const CANCELLATION_REASONS = [
    'Customer not found',
    'Wrong address',
    'Car trouble',
    'Too far away',
    'Personal emergency',
    'Other',
];

const HomeScreen = () => {
    const navigation = useNavigation();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentRequest, setCurrentRequest] = useState<any>(null);
    const [activeRide, setActiveRide] = useState<any>(null);
    const [distanceToPickup, setDistanceToPickup] = useState<number | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCanceling, setIsCanceling] = useState(false);
    const [showArrivalConfirmModal, setShowArrivalConfirmModal] = useState(false);
    const [isConfirmingArrival, setIsConfirmingArrival] = useState(false);
    const [todayEarnings, setTodayEarnings] = useState<number>(0);
    const [showSidebar, setShowSidebar] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        buttons?: { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
    }>({ visible: false, title: '', message: '' });
    const mapRef = useRef<MapView>(null);
    const hasCentered = useRef(false);

    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const fetchTodayEarnings = async () => {
        try {
            const response = await driverApiService.getDailyPayout();
            if (response.data.success) {
                setTodayEarnings(response.data.summary.totalDriverShare || 0);
            }
        } catch (error) {
            console.error('Failed to fetch today earnings:', error);
        }
    };

    const fetchActiveRide = async () => {
        try {
            const response = await driverApiService.getActiveRide();
            if (response.data.success && response.data.ride) {
                console.log('🚕 [Driver] Found active ride on mount:', response.data.ride.rideId);
                setActiveRide(response.data.ride);
            }
        } catch (error) {
            console.log('🚕 [Driver] No active ride found on mount');
        }
    };

    useEffect(() => {
        if (user) {
            fetchTodayEarnings();
            if (isOnline) {
                fetchActiveRide();
            }
        }
    }, [user, isOnline]);

    useEffect(() => {
        let locationWatcher: Location.LocationSubscription;

        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            locationWatcher = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    distanceInterval: 2,
                    timeInterval: 1000
                },
                (newLocation) => {
                    setLocation(newLocation);
                    if (isOnline) {
                        socketService.emit('update-location', {
                            lat: newLocation.coords.latitude,
                            lng: newLocation.coords.longitude,
                            heading: newLocation.coords.heading,
                            speed: newLocation.coords.speed
                        });
                    }

                    if (activeRide && activeRide.status === 'accepted') {
                        checkProximity(newLocation, activeRide.pickup);
                    }
                }
            );
        })();

        return () => locationWatcher?.remove();
    }, [isOnline, activeRide]);

    useEffect(() => {
        if (location && !hasCentered.current && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            }, 1000);
            hasCentered.current = true;
        }
    }, [location]);

    useEffect(() => {
        if (isOnline && user) {
            socketService.connect(user.uid, 'driver', location ? {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
                heading: location.coords.heading
            } : undefined);

            if (location) {
                setTimeout(() => {
                    socketService.emit('update-location', {
                        lat: location.coords.latitude,
                        lng: location.coords.longitude,
                        heading: location.coords.heading || 0,
                        speed: location.coords.speed || 0
                    });
                }, 1000);
            }

            socketService.on('new-ride-request', (data) => {
                console.log('📬 [Driver] New Ride Request RECEIVED:', JSON.stringify(data));
                setCurrentRequest(data);
            });

            socketService.on('ride-cancelled', (data) => {
                const isCustomer = data?.cancelledBy === 'customer';
                const title = isCustomer ? 'Ride Cancelled' : 'Ride Cancelled (You)';
                const message = isCustomer
                    ? 'The customer has cancelled the ride request.'
                    : 'You have successfully cancelled this ride.';

                setAlertConfig({
                    visible: true,
                    title,
                    message,
                    buttons: [{ text: 'OK', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) }]
                });
                setActiveRide(null);
                setCurrentRequest(null);
            });
        } else {
            socketService.disconnect();
        }

        return () => {
            socketService.off('new-ride-request');
            socketService.off('ride-cancelled');
        };
    }, [isOnline, user]);

    const checkProximity = (currentLoc: Location.LocationObject, targetLoc: { lat: number, lng: number }) => {
        const dist = getDistance(
            currentLoc.coords.latitude,
            currentLoc.coords.longitude,
            targetLoc.lat,
            targetLoc.lng
        );
        setDistanceToPickup(dist);
    };

    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const toggleOnlineStatus = async () => {
        if (!user || user.registrationStatus !== 'approved') {
            Alert.alert('Activation Required', 'Your account must be approved before you can go online.');
            return;
        }

        setLoading(true);
        try {
            if (isOnline) {
                await driverApiService.goOffline();
                setIsOnline(false);
            } else {
                if (!location) {
                    Alert.alert('Location Required', 'Please wait for your location to be determined.');
                    return;
                }
                const response = await driverApiService.goOnline({
                    location: {
                        lat: location.coords.latitude,
                        lng: location.coords.longitude
                    }
                });
                setIsOnline(true);

                // Handle discovery of existing requests
                if (response.data.pendingRequest) {
                    setCurrentRequest(response.data.pendingRequest);
                }
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRide = async (rideId: string) => {
        try {
            const response = await driverApiService.acceptRide(rideId);
            if (response.data.success) {
                const rideData = response.data.ride || response.data.data;
                if (rideData) {
                    Alert.alert('Debug: Accepted', `Ride ${rideId.substring(0, 5)} is now active!`);
                    setActiveRide(rideData);
                    setCurrentRequest(null);
                }
            } else {
                Alert.alert('Error', response.data.message || 'Failed to accept ride');
                setCurrentRequest(null);
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to accept ride');
            setCurrentRequest(null);
        }
    };

    const handleArrived = async () => {
        const id = activeRide?.rideId || activeRide?.id || activeRide?._id;
        console.log('🏁 [DIAGNOSTIC] handleArrived request | ID:', id, 'Status: arrived');
        if (!id) {
            Alert.alert('Error', 'INTERNAL ERROR: Ride ID is missing. Please restart the app.');
            return;
        }

        try {
            setIsConfirmingArrival(true);
            const response = await driverApiService.updateStatus({
                rideId: id,
                status: 'arrived'
            });
            if (response.data.success) {
                Alert.alert('Debug: Arrived', 'Wait for Customer button should now show.');
                setActiveRide({ ...activeRide, status: 'arrived' });
                setShowArrivalConfirmModal(false);
            }
        } catch (error: any) {
            console.error('🔴 Arrived Status Update ERROR:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to update status: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsConfirmingArrival(false);
        }
    };

    const handleStartRide = async () => {
        const id = activeRide?.rideId || activeRide?.id || activeRide?._id;
        console.log('🏁 [DIAGNOSTIC] handleStartRide request | ID:', id, 'Status: in_progress');
        if (!id) {
            Alert.alert('Error', 'INTERNAL ERROR: Ride ID is missing. Please restart the app.');
            return;
        }

        try {
            const response = await driverApiService.startRide(id);
            if (response.data.success) {
                Alert.alert('Debug: Started', 'Trip In Progress UI should now show.');
                setActiveRide({ ...activeRide, status: 'in_progress' });
            }
        } catch (error: any) {
            console.error('🔴 Start Ride ERROR:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to start ride');
        }
    };

    const handleCompleteRide = async () => {
        const id = activeRide?.rideId || activeRide?.id || activeRide?._id;
        console.log('🏁 [DIAGNOSTIC] handleCompleteRide request | ID:', id, 'Status: completed');
        if (!id) {
            Alert.alert('Error', 'INTERNAL ERROR: Ride ID is missing.');
            return;
        }

        try {
            const response = await driverApiService.completeRide({
                rideId: id,
                actualDistanceKm: activeRide.distanceKm || 5.2,
                actualDurationMin: activeRide.durationMin || 12
            });
            if (response.data.success) {
                const completedRide = response.data.ride || response.data.data;
                setActiveRide({ ...completedRide, status: 'completed', rideId: id });
                fetchTodayEarnings();
            }
        } catch (error: any) {
            console.error('🔴 Complete Ride ERROR:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to complete ride');
        }
    };

    const handleConfirmPayment = async () => {
        const id = activeRide?.rideId || activeRide?.id || activeRide?._id;
        console.log('🏁 [DIAGNOSTIC] handleConfirmPayment request | ID:', id, 'Status: paid');
        if (!id) {
            Alert.alert('Error', 'INTERNAL ERROR: Ride ID is missing.');
            return;
        }

        try {
            const response = await driverApiService.confirmPayment(id);
            if (response.data.success) {
                Alert.alert('Success', 'Payment confirmed.');
                setActiveRide(null);
            }
        } catch (error: any) {
            console.error('🔴 Confirm Payment ERROR:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to confirm payment');
        }
    };

    const handleCancelRide = async (reason: string) => {
        setIsCanceling(true);
        try {
            const response = await driverApiService.cancelRide(activeRide.rideId || activeRide.id, reason);
            if (response.data.success) {
                setActiveRide(null);
                setShowCancelModal(false);
            }
        } catch (error: any) {
            Alert.alert('Error', 'Failed to cancel ride');
        } finally {
            setIsCanceling(false);
        }
    };



    return (
        <View style={styles.container}>
            <RideMap
                ref={mapRef}
                location={location}
                activeRide={activeRide}
                initialRegion={{
                    latitude: location?.coords.latitude || -1.2864,
                    longitude: location?.coords.longitude || 36.8172,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }}
                googleMapsApiKey={GOOGLE_MAPS_APIKEY}
            />

            <SafeAreaView style={styles.overlay}>
                <StatusHeader
                    isOnline={isOnline}
                    statusText={activeRide ? `STATUS: ${activeRide.status.toUpperCase()}` : (isOnline ? 'Online' : 'Offline')}
                    onMenuPress={() => setShowSidebar(true)}
                />

                <View style={styles.bottomContainer}>
                    <View style={styles.infoCard}>
                        <ActiveRidePhaseCard
                            status={activeRide?.status}
                            onArrived={handleArrived}
                            onStartRide={handleStartRide}
                            onCompleteRide={handleCompleteRide}
                            onConfirmPayment={handleConfirmPayment}
                        />

                        <RideInfoCard
                            activeRide={activeRide}
                            user={user}
                            todayEarnings={todayEarnings}
                            onShowCancelModal={() => setShowCancelModal(true)}
                            onCallCustomer={() => Alert.alert('Call', 'Coming soon')}
                            onNavigateToEarnings={() => (navigation as any).navigate('Earnings')}
                            onNavigateToReferral={() => (navigation as any).navigate('Referral')}
                        />
                    </View>

                    {!activeRide && (
                        <OnlineToggleButton
                            isOnline={isOnline}
                            onPress={toggleOnlineStatus}
                            loading={loading}
                        />
                    )}
                </View>
            </SafeAreaView>

            <NewRequestOverlay
                request={currentRequest}
                onAccept={handleAcceptRide}
                onReject={() => setCurrentRequest(null)}
            />

            <PremiumModal
                visible={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                title="Cancel Ride?"
                heightPercentage={0.6}
            >
                <View style={styles.reasonsList}>
                    {CANCELLATION_REASONS.map((reason) => (
                        <TouchableOpacity
                            key={reason}
                            style={styles.reasonItem}
                            onPress={() => handleCancelRide(reason)}
                        >
                            <Text style={styles.reasonText}>{reason}</Text>
                            <ChevronRight size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                    ))}
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCancelModal(false)}>
                    <Text style={styles.closeBtnText}>Keep Ride</Text>
                </TouchableOpacity>
            </PremiumModal>

            <PremiumAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
            />

            <SidebarMenu
                visible={showSidebar}
                user={user}
                onClose={() => setShowSidebar(false)}
                onLogout={logout}
                onDashboardPress={() => setShowSidebar(false)}
                onHistoryPress={() => (navigation as any).navigate('History')}
                onEarningsPress={() => (navigation as any).navigate('Earnings')}
                onReferralPress={() => (navigation as any).navigate('Referral')}
                onAccountPress={() => (navigation as any).navigate('Account')}
                onHelpPress={() => (navigation as any).navigate('Help')}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    overlay: { flex: 1, justifyContent: 'space-between', padding: 16 },
    bottomContainer: { paddingBottom: 20 },
    infoCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 6 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContentSmall: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
    reasonsList: { marginBottom: 20 },
    reasonItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
    reasonText: { fontSize: 16, fontWeight: '600' },
    closeBtn: { padding: 16, borderRadius: 16, backgroundColor: '#F2F2F7', alignItems: 'center' },
    closeBtnText: { fontSize: 16, fontWeight: '700' },
});

export default HomeScreen;
