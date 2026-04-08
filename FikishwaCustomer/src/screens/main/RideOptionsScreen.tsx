import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    StatusBar, ScrollView, ActivityIndicator, Alert, Modal, Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '../../theme/ThemeContext';
import { darkMapStyle, lightMapStyle } from '../../theme/mapStyles';
import api from '../../services/api';
import customerApiService from '../../services/customerApiService';
import { API_ENDPOINTS } from '../../config/api';
import { ChevronLeft, Info, Calendar, User, Briefcase, Plus, Minus, Tag, ChevronRight, Receipt } from 'lucide-react-native';
import { GOOGLE_MAPS_API_KEY } from '../../config/googleMaps';
import { decodePolyline } from '../../utils/polyline';
import { socketService } from '../../services/socketService';
import { locationService } from '../../services/locationService';
const carMarkerImg = require('../../assets/images/car_marker.png');

interface VehicleCategory {
    id: string;
    name: string;
    description: string;
    baseFare: number;
    perKmRate: number;
    perMinRate: number;
    perStopFee: number;
    iconEmoji: string;
    imageUrl?: string;
    capacity: number;
    eta: number;
    estimatedFare?: number;
}

const DEFAULT_CATEGORIES: VehicleCategory[] = [
    { id: 'fikaa', name: 'Fikaa', description: 'Everyday affordable rides', baseFare: 100, perKmRate: 30, perMinRate: 3, perStopFee: 50, iconEmoji: '🛵', capacity: 1, eta: 3 },
    { id: 'premium', name: 'Premium', description: 'Luxury comfort', baseFare: 300, perKmRate: 55, perMinRate: 8, perStopFee: 150, iconEmoji: '🚙', capacity: 4, eta: 6 },
];

const RideOptionsScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { pickup, dropoff } = route.params;
    const { colors, spacing, fontSizes, insets } = useTheme();
    const mapRef = useRef<MapView>(null);

    const [categories, setCategories] = useState<VehicleCategory[]>([]);
    const [selected, setSelected] = useState<string>('');
    const [estimates, setEstimates] = useState<any[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa'>('cash');
    const [requesting, setRequesting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [routeCoords, setRouteCoords] = useState<any[]>([]);
    const [distanceKm, setDistanceKm] = useState<string>('0');
    const [durationMin, setDurationMin] = useState<number>(0);

    // New UI States
    const [passengers, setPassengers] = useState<number>(1);
    const [luggage, setLuggage] = useState<number>(0);
    const [showRequiredDetails, setShowRequiredDetails] = useState<boolean>(false);
    const [showFareBreakdown, setShowFareBreakdown] = useState<boolean>(false);
    const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fitMapToDriversAndPickup = (drivers: any[]) => {
        if (!mapRef.current || !pickup) return;

        console.log('[RideOptions] Fitting map to pickup and', drivers.length, 'drivers');

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
                edgePadding: { top: 100, right: 100, bottom: 150, left: 100 },
                animated: true
            });
        } else {
            // Fallback to just show pickup if no drivers
            mapRef.current.animateToRegion({
                latitude: Number(pickup.lat),
                longitude: Number(pickup.lng),
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            }, 1000);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Get estimates and route in one backend call
            const res = await customerApiService.getRideEstimates({
                pickup,
                dropoff,
                rideType: 'standard'
            });

            console.log('[RideOptions] Server estimate response (v' + (res.data.version || '1.0') + '):', res.data);

            if (res.data.success && Array.isArray(res.data.estimates)) {
                const serverEstimates = res.data.estimates;
                setEstimates(serverEstimates);
                setDistanceKm(res.data.distanceKm);
                setDurationMin(res.data.durationMin);
                setRouteCoords(decodePolyline(res.data.routePolyline));

                // Map to VehicleCategory for UI compatibility
                const mapped: VehicleCategory[] = serverEstimates.map((e: any) => ({
                    id: e.categoryId,
                    name: e.name,
                    description: 'Comfortable ride',
                    baseFare: 0, // Not needed for UI display anymore
                    perKmRate: 0,
                    perMinRate: 0,
                    perStopFee: 0,
                    estimatedFare: e.estimatedFare,
                    iconEmoji: e.iconEmoji,
                    imageUrl: e.imageUrl,
                    capacity: e.capacity || 4,
                    eta: e.eta,
                }));
                setCategories(mapped);
                if (mapped.length > 0) setSelected(mapped[0].id);

                // Initial fit to show pickup and drivers if available
                setTimeout(() => {
                    fitMapToDriversAndPickup(availableDrivers);
                }, 500);
            } else {
                console.error('[RideOptions] Server success but estimates missing or invalid:', res.data);
                Alert.alert('Error', 'Server returned invalid estimate data.');
            }
        } catch (error) {
            console.error('[RideOptions] Fetch data error:', error);
            Alert.alert('Error', 'Failed to get ride estimates. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getSelectedEstimate = () => {
        return estimates.find(e => e.categoryId === selected);
    };

    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                const response = await customerApiService.getAvailableDrivers();
                if (response.data?.success && Array.isArray(response.data.drivers)) {
                    const drivers = response.data.drivers;
                    setAvailableDrivers(drivers);
                    // If we just got drivers for the first time, fit the map
                    if (availableDrivers.length === 0 && drivers.length > 0) {
                        fitMapToDriversAndPickup(drivers);
                    }
                }
            } catch (err) {
                console.log('[RideOptions] Driver fetch error:', err);
            }
        };

        fetchDrivers();
        socketService.on('available-drivers', (drivers: any[]) => {
            if (Array.isArray(drivers)) {
                setAvailableDrivers(drivers);
            }
        });

        const interval = setInterval(fetchDrivers, 10000); // 10s fallback poll

        return () => {
            socketService.off('available-drivers');
            clearInterval(interval);
        };
    }, []);

    const handleRequestRide = async () => {
        const est = getSelectedEstimate();
        if (!est) {
            Alert.alert('Error', 'Please select a ride category.');
            return;
        }

        setRequesting(true);
        const payload = {
            pickup,
            dropoff,
            rideType: selected,
            paymentMethod,
        };
        console.log('[RideOptions] Requesting ride with payload:', payload);

        try {
            const response = await customerApiService.requestRide(payload);
            if (response.data.success) {
                const ride = response.data.ride;
                console.log('[RideOptions] Request SUCCESS. Ride data:', JSON.stringify(ride));

                navigation.replace('Matching', {
                    rideId: ride.rideId,
                    pickup,
                    dropoff,
                    rideType: selected,
                    paymentMethod,
                    estimatedFare: ride.estimatedFare,
                    distanceKm,
                    durationMin,
                });
            } else {
                Alert.alert('Error', response.data.message || 'Could not request ride.');
            }
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to request ride.');
        } finally {
            setRequesting(false);
        }
    };

    const selectedCat = categories.find(c => c.id === selected);
    const isDarkTheme = colors.mapStyle.toString() === 'dark';

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Map Area */}
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={StyleSheet.absoluteFillObject}
                    customMapStyle={isDarkTheme ? darkMapStyle : lightMapStyle}
                    showsUserLocation={false}
                    initialRegion={{
                        latitude: Number(pickup.lat),
                        longitude: Number(pickup.lng),
                        latitudeDelta: 0.012,
                        longitudeDelta: 0.012,
                    }}
                >
                    {routeCoords.length > 0 && (
                        <Polyline
                            coordinates={routeCoords}
                            strokeColor={colors.primary}
                            strokeWidth={4}
                        />
                    )}

                    <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}>
                        <View style={[styles.mapPin, { backgroundColor: colors.success }]}>
                            <View style={styles.mapPinInner} />
                        </View>
                    </Marker>

                    <Marker coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }}>
                        <View style={styles.tooltipBox}>
                            <View style={styles.tooltipLeft}>
                                <Text style={styles.tooltipTextBold}>{durationMin.toFixed(0)}</Text>
                                <Text style={styles.tooltipTextSmall}>min(s)</Text>
                            </View>
                            <View style={styles.tooltipRight}>
                                <Text style={styles.tooltipTextMedium} numberOfLines={2}>
                                    {distanceKm} km(s)
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.mapPin, { backgroundColor: colors.primary, alignSelf: 'center', marginTop: -5 }]}>
                            <View style={styles.mapPinInner} />
                        </View>
                    </Marker>

                    {/* Nearby Drivers */}
                    {availableDrivers.map((driver) => {
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
                                    style={{ width: 45, height: 30, resizeMode: 'contain' }}
                                />
                            </Marker>
                        );
                    })}
                </MapView>

                {/* Top Nav Overlay */}
                <SafeAreaView style={styles.topNav}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[styles.backBtn, { backgroundColor: colors.backgroundCard }]}
                    >
                        <ChevronLeft size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                </SafeAreaView>
            </View>

            {/* Bottom Sheet */}
            <View style={[styles.sheet, { backgroundColor: colors.backgroundCard, paddingBottom: insets.bottom || 20 }]}>
                {/* Pull indicator */}
                <View style={styles.pullIndicator} />

                <Text style={[styles.sheetTitle, { color: colors.textSecondary }]}>
                    Choose a ride, or swipe up for more
                </Text>

                {/* Ride List */}
                <ScrollView style={styles.rideList} showsVerticalScrollIndicator={false}>
                    {loading ? (
                        <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
                    ) : (
                        categories.map((cat) => {
                            const isSelected = selected === cat.id;
                            const catEst = estimates.find(e => e.categoryId === cat.id);
                            const fareStr = catEst ? catEst.estimatedFare : cat.estimatedFare;

                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => setSelected(cat.id)}
                                    style={[
                                        styles.rideRow,
                                        isSelected && { backgroundColor: colors.backgroundHover, borderColor: colors.primary, borderWidth: 1 }
                                    ]}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.rideIconBlock}>
                                        {cat.imageUrl ? (
                                            <Image source={{ uri: cat.imageUrl }} style={{ width: 44, height: 44, resizeMode: 'contain' }} />
                                        ) : (
                                            <Text style={{ fontSize: 32 }}>{cat.iconEmoji}</Text>
                                        )}
                                    </View>

                                    <View style={styles.rideInfoBlock}>
                                        <Text style={[styles.rideName, { color: colors.textPrimary }]}>{cat.name}({cat.capacity} Pass)</Text>
                                        <View style={styles.capacityRow}>
                                            <User size={12} color={colors.textSecondary} />
                                            <Text style={[styles.capacityText, { color: colors.textSecondary }]}>{cat.capacity}</Text>
                                            <Briefcase size={12} color={colors.textSecondary} style={{ marginLeft: 6 }} />
                                            <Text style={[styles.capacityText, { color: colors.textSecondary }]}>10</Text>
                                        </View>
                                    </View>

                                    <View style={styles.ridePriceBlock}>
                                        <TouchableOpacity
                                            style={styles.infoIconWrap}
                                            onPress={(e) => {
                                                e.stopPropagation(); // prevent selecting ride when clicking icon
                                                setSelected(cat.id);
                                                setShowFareBreakdown(true);
                                            }}
                                        >
                                            <Info size={16} color={colors.primary} />
                                        </TouchableOpacity>
                                        <Text style={[styles.ridePrice, { color: colors.textPrimary }]}>KES {fareStr}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}

                    {/* Divider */}
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Features Row */}
                    <View style={styles.featuresRow}>
                        <TouchableOpacity
                            style={styles.couponBtn}
                            onPress={() => navigation.navigate('Coupons')}
                        >
                            <Tag size={16} color={colors.primary} />
                            <Text style={[styles.couponText, { color: colors.primary }]}>Coupon</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.detailsBtn}
                            onPress={() => setShowRequiredDetails(true)}
                        >
                            <User size={16} color={colors.textSecondary} />
                            <Briefcase size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Payment Row */}
                    <View style={styles.paymentRow}>
                        <Text style={[styles.paymentMethodLabel, { color: colors.textPrimary }]}>Personal</Text>
                        <TouchableOpacity style={styles.paymentSelector} onPress={() => setPaymentMethod(paymentMethod === 'cash' ? 'mpesa' : 'cash')}>
                            <Text style={[styles.paymentMethodValue, { color: colors.textSecondary }]}>
                                {paymentMethod === 'cash' ? 'Cash' : 'M-Pesa'}
                            </Text>
                            <ChevronRight size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Action Row */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.primarySubmitBtn, { backgroundColor: colors.primary, opacity: requesting ? 0.7 : 1 }]}
                            onPress={handleRequestRide}
                            disabled={requesting}
                            activeOpacity={0.8}
                        >
                            {requesting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={[styles.primarySubmitText, { color: colors.textOnPrimary }]}>RIDE NOW</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.scheduleBtn}
                            onPress={() => {
                                if (!selected) {
                                    Alert.alert('Selection Required', 'Please select a ride type first.');
                                    return;
                                }
                                setShowFareBreakdown(true);
                            }}
                        >
                            <Receipt size={22} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>

            {/* --- MODALS --- */}

            {/* Fare Breakdown Modal */}
            <Modal
                visible={showFareBreakdown}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowFareBreakdown(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.backgroundCard, paddingBottom: insets.bottom || 24 }]}>
                        <View style={styles.modalHandle} />

                        {selectedCat && (
                            <>
                                <View style={styles.fbHeader}>
                                    {selectedCat.imageUrl ? (
                                        <Image source={{ uri: selectedCat.imageUrl }} style={{ width: 60, height: 60, resizeMode: 'contain' }} />
                                    ) : (
                                        <Text style={{ fontSize: 32 }}>{selectedCat.iconEmoji}</Text>
                                    )}
                                    <View style={{ marginLeft: 16, flex: 1 }}>
                                        <Text style={[styles.fbName, { color: colors.textSecondary }]}>{selectedCat.name}({selectedCat.capacity} Pass)</Text>
                                        <View style={styles.capacityRow}>
                                            <User size={14} color={colors.textSecondary} />
                                            <Text style={[styles.capacityText, { color: colors.textSecondary }]}>{selectedCat.capacity}</Text>
                                            <Briefcase size={14} color={colors.textSecondary} style={{ marginLeft: 6 }} />
                                            <Text style={[styles.capacityText, { color: colors.textSecondary }]}>10</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.fbTotalLarge, { color: colors.textPrimary }]}>
                                        KES {estimates.find(e => e.categoryId === selected)?.estimatedFare || selectedCat.estimatedFare}
                                    </Text>
                                </View>

                                <Text style={[styles.fbNote, { color: colors.textSecondary }]}>
                                    *Note: Minimum Fare applies if Trip Fare is lower.
                                </Text>
                                <View style={[styles.separator, { backgroundColor: colors.border }]} />

                                <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                                    {(() => {
                                        const estInfo = estimates.find(e => e.categoryId === selected);
                                        const bkd = estInfo?.breakdown || {};
                                        return (
                                            <>
                                                {bkd.minFare !== undefined && (
                                                    <View style={styles.fbRow}><Text style={[styles.fbLabel, { color: colors.textSecondary }]}>Minimum Fare</Text><Text style={[styles.fbVal, { color: colors.textSecondary }]}>KES {bkd.minFare}</Text></View>
                                                )}
                                                {bkd.baseFare !== undefined && (
                                                    <View style={styles.fbRow}><Text style={[styles.fbLabel, { color: colors.textSecondary }]}>Base Fare</Text><Text style={[styles.fbVal, { color: colors.textSecondary }]}>KES {bkd.baseFare}</Text></View>
                                                )}
                                                {bkd.distanceFee !== undefined && (
                                                    <View style={styles.fbRow}><Text style={[styles.fbLabel, { color: colors.textSecondary }]}>Distance Fare</Text><Text style={[styles.fbVal, { color: colors.textSecondary }]}>KES {bkd.distanceFee}</Text></View>
                                                )}
                                                {bkd.timeFee !== undefined && (
                                                    <View style={styles.fbRow}><Text style={[styles.fbLabel, { color: colors.textSecondary }]}>Time Fare</Text><Text style={[styles.fbVal, { color: colors.textSecondary }]}>KES {bkd.timeFee}</Text></View>
                                                )}

                                                <View style={[styles.separator, { backgroundColor: colors.border }]} />
                                                <View style={styles.fbRow}><Text style={[styles.fbLabelBold, { color: colors.textPrimary }]}>Trip Fare</Text><Text style={[styles.fbValBold, { color: colors.textPrimary }]}>KES {bkd.subtotal !== undefined ? bkd.subtotal : (estInfo?.estimatedFare || selectedCat.estimatedFare)}</Text></View>

                                                {bkd.tax !== undefined && (
                                                    <View style={styles.fbRow}><Text style={[styles.fbLabel, { color: colors.textSecondary }]}>+ Tax</Text><Text style={[styles.fbVal, { color: colors.textSecondary }]}>KES {bkd.tax}</Text></View>
                                                )}
                                                {bkd.vat !== undefined && (
                                                    <View style={[styles.fbRow, { paddingLeft: 20 }]}><Text style={[styles.fbLabel, { color: colors.textSecondary }]}>• VAT</Text><Text style={[styles.fbVal, { color: colors.textSecondary }]}>KES {bkd.vat}</Text></View>
                                                )}
                                                {bkd.discount !== undefined && (
                                                    <View style={styles.fbRow}><Text style={[styles.fbLabel, { color: colors.textSecondary }]}>- Promotional Discount</Text><Text style={[styles.fbVal, { color: colors.textSecondary }]}>KES {Number(bkd.discount).toFixed(2)}</Text></View>
                                                )}

                                                <View style={[styles.separator, { backgroundColor: colors.border }]} />
                                                <View style={styles.fbRow}>
                                                    <Text style={[styles.fbLabelBold, { color: colors.textPrimary }]}>Total Fare</Text>
                                                    <Text style={[styles.fbValBold, { color: colors.textPrimary }]}>
                                                        KES {estInfo?.estimatedFare || selectedCat.estimatedFare}
                                                    </Text>
                                                </View>
                                            </>
                                        );
                                    })()}
                                </ScrollView>

                                <TouchableOpacity
                                    style={[styles.primarySubmitBtn, { backgroundColor: colors.primary, marginTop: 16 }]}
                                    onPress={() => setShowFareBreakdown(false)}
                                >
                                    <Text style={[styles.primarySubmitText, { color: colors.textOnPrimary }]}>Done</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Required Details Modal */}
            <Modal
                visible={showRequiredDetails}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowRequiredDetails(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.backgroundCard, paddingBottom: insets.bottom || 24 }]}>
                        <View style={styles.modalHandle} />
                        <Text style={[styles.rdMainTitle, { color: colors.textPrimary }]}>Required Details</Text>

                        {/* Passenger Selector */}
                        <View style={styles.rdSection}>
                            <View style={styles.rdIconWrap}><User size={20} color={colors.textSecondary} /></View>
                            <View style={styles.rdTextWrap}>
                                <Text style={[styles.rdTitle, { color: colors.textPrimary }]}>Select Number of Passenger</Text>
                                <Text style={[styles.rdSub, { color: colors.textTertiary }]}>Based on a selected number of passengers, the Vehicle option will be appear</Text>
                                <View style={styles.stepperWrap}>
                                    <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: colors.backgroundHover }]} onPress={() => setPassengers(Math.max(1, passengers - 1))}>
                                        <Minus size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                    <Text style={[styles.stepperVal, { color: colors.primary }]}>{passengers}</Text>
                                    <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: colors.backgroundHover }]} onPress={() => setPassengers(Math.min(10, passengers + 1))}>
                                        <Plus size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Luggage Selector */}
                        <View style={[styles.rdSection, { marginTop: 24, marginBottom: 24 }]}>
                            <View style={styles.rdIconWrap}><Briefcase size={20} color={colors.textSecondary} /></View>
                            <View style={styles.rdTextWrap}>
                                <Text style={[styles.rdTitle, { color: colors.textPrimary }]}>Select Luggage</Text>
                                <Text style={[styles.rdSub, { color: colors.textTertiary }]}>Carry bags will not be considered as Luggage, so you can select as 0 Luggage.</Text>
                                <View style={styles.stepperWrap}>
                                    <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: colors.backgroundHover }]} onPress={() => setLuggage(Math.max(0, luggage - 1))}>
                                        <Minus size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                    <Text style={[styles.stepperVal, { color: colors.primary }]}>{luggage}</Text>
                                    <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: colors.backgroundHover }]} onPress={() => setLuggage(Math.min(10, luggage + 1))}>
                                        <Plus size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.primarySubmitBtn, { backgroundColor: colors.primary }]}
                            onPress={() => setShowRequiredDetails(false)}
                        >
                            <Text style={[styles.primarySubmitText, { color: colors.textOnPrimary }]}>Continue</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    mapContainer: { flex: 1 },
    mapPin: {
        width: 14, height: 14, borderRadius: 7,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#fff',
        shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, elevation: 4,
    },
    mapPinInner: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff' },

    // Tooltips
    tooltipBox: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 4,
        padding: 4,
        marginBottom: 8,
        shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 5,
    },
    tooltipLeft: {
        backgroundColor: '#4A2B4D', // Dark purple background from screenshot
        padding: 6,
        borderRadius: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tooltipRight: {
        backgroundColor: '#E6E6FA', // Light purple background
        padding: 6,
        paddingHorizontal: 8,
        borderRadius: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 2,
    },
    tooltipTextBold: { color: '#fff', fontSize: 13, fontWeight: '700' },
    tooltipTextSmall: { color: 'rgba(255,255,255,0.8)', fontSize: 10 },
    tooltipTextMedium: { color: '#333', fontSize: 13, fontWeight: '600', maxWidth: 100 },

    topNav: {
        position: 'absolute', top: 0, left: 0, right: 0,
        paddingHorizontal: 16, paddingTop: 16,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
    },

    // Sheet Navigation
    sheet: {
        flex: 1,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingTop: 12, marginTop: -20,
        maxHeight: '55%',
    },
    pullIndicator: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 16,
    },
    sheetTitle: {
        textAlign: 'center', fontSize: 16, marginBottom: 16,
    },
    rideList: { paddingHorizontal: 20 },

    // Ride Rows
    rideRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, paddingHorizontal: 12,
        borderRadius: 12, marginBottom: 8,
        borderWidth: 1, borderColor: 'transparent',
    },
    rideIconBlock: { width: 48, alignItems: 'center' },
    rideInfoBlock: { flex: 1, paddingLeft: 12 },
    ridePriceBlock: { alignItems: 'flex-end', flexDirection: 'row' },
    rideName: { fontSize: 17, fontWeight: '500', marginBottom: 6 },
    capacityRow: { flexDirection: 'row', alignItems: 'center' },
    capacityText: { fontSize: 12, marginLeft: 4 },
    infoIconWrap: { padding: 4, marginRight: 8 },
    ridePrice: { fontSize: 16, fontWeight: '600' },

    divider: { height: 1, marginVertical: 12, opacity: 0.5 },

    featuresRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    couponBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
    couponText: { fontWeight: '600', fontSize: 15 },
    detailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9' },

    paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    paymentMethodLabel: { fontSize: 17, fontWeight: '600' },
    paymentSelector: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    paymentMethodValue: { fontSize: 16 },

    actionRow: { flexDirection: 'row', gap: 12 },
    primarySubmitBtn: { flex: 1, borderRadius: 999, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
    primarySubmitText: { fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
    scheduleBtn: { width: 56, height: 56, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },

    // Modal Shared
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingTop: 16 },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 20 },

    // Fare Breakdown Modal
    fbHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    fbName: { fontSize: 18, fontWeight: '500', marginBottom: 4 },
    fbTotalLarge: { fontSize: 18, fontWeight: '600' },
    fbNote: { fontSize: 13, marginTop: 8 },
    separator: { height: 1, marginVertical: 16, opacity: 0.5 },
    fbRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    fbLabel: { fontSize: 15 },
    fbVal: { fontSize: 15 },
    fbLabelBold: { fontSize: 16, fontWeight: '700' },
    fbValBold: { fontSize: 16, fontWeight: '700' },

    // Required Details Modal
    rdMainTitle: { fontSize: 20, fontWeight: '700', marginBottom: 24 },
    rdSection: { flexDirection: 'row' },
    rdIconWrap: { width: 30, paddingTop: 2 },
    rdTextWrap: { flex: 1 },
    rdTitle: { fontSize: 17, fontWeight: '500', marginBottom: 4 },
    rdSub: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
    stepperWrap: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9' },
    stepperBtn: { padding: 10, borderRadius: 20 },
    stepperVal: { width: 30, textAlign: 'center', fontSize: 16, fontWeight: '600' },
});

export default RideOptionsScreen;
