import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Calendar, Truck, User, Info, CreditCard, MapPin } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const RideDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { ride } = route.params;

    // Helper to format dates (handles strings and Firebase Timestamps)
    const formatRideDate = (dateVal: any) => {
        if (!dateVal) return 'N/A';
        try {
            if (dateVal.toDate && typeof dateVal.toDate === 'function') {
                return dateVal.toDate().toLocaleString();
            }
            if (dateVal.seconds) {
                return new Date(dateVal.seconds * 1000).toLocaleString();
            }
            return new Date(dateVal).toLocaleString();
        } catch (e) {
            return 'N/A';
        }
    };

    // Helper to handle both object and string address formats
    const getAddressText = (mainField: any, aliasField: any) => {
        return aliasField || (typeof mainField === 'string' ? mainField : mainField?.address) || 'N/A';
    };

    const fare = Number(ride.fare || ride.finalFare || 0);
    // If we have separate baseCommission and vat, use them. 
    // Otherwise fallback to a split of the total commission if available.
    const totalCommission = Number(ride.commission || (fare * 0.15));
    const baseCommission = ride.baseCommission !== undefined ? Number(ride.baseCommission) : (totalCommission * 0.15 / 0.19); // Rough guess for legacy
    const vat = ride.vat !== undefined ? Number(ride.vat) : (totalCommission - baseCommission);

    const driverShare = Number(ride.driverShare || (fare - totalCommission));

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={28} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ride Summary</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Earnings Card */}
                <View style={styles.earningsCard}>
                    <Text style={styles.earningsLabel}>Trip Earnings</Text>
                    <Text style={styles.earningsAmount}>KES {driverShare.toFixed(2)}</Text>
                    <View style={styles.statusBadgeSmall}>
                        <Text style={styles.statusTextSmall}>{(ride.status || 'completed').toUpperCase()}</Text>
                    </View>
                </View>

                {/* Ride ID row */}
                <View style={styles.idRow}>
                    <Text style={styles.rideIdLabel}>Reference ID</Text>
                    <Text style={styles.rideIdValue}>{ride.rideId?.substring(0, 12).toUpperCase() || 'N/A'}</Text>
                </View>

                {/* Addresses */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Route Details</Text>
                    <View style={styles.addressItem}>
                        <View style={[styles.dot, { backgroundColor: '#4CD964' }]} />
                        <View style={styles.addressContent}>
                            <Text style={styles.addressLabel}>Pickup</Text>
                            <Text style={styles.addressText}>{getAddressText(ride.pickup, ride.pickupAddress)}</Text>
                        </View>
                    </View>
                    <View style={styles.addressLine} />
                    <View style={styles.addressItem}>
                        <View style={[styles.dot, { backgroundColor: '#FF3B30' }]} />
                        <View style={styles.addressContent}>
                            <Text style={styles.addressLabel}>Destination</Text>
                            <Text style={styles.addressText}>{getAddressText(ride.dropoff, ride.destinationAddress)}</Text>
                        </View>
                    </View>

                    {/* Total Distance */}
                    <View style={styles.distanceBadge}>
                        <MapPin size={14} color="#64748B" />
                        <Text style={styles.distanceText}>
                            Total Distance: {Number(ride.distance || ride.actualDistanceKm || ride.distanceKm || 0).toFixed(2)} km
                        </Text>
                    </View>
                </View>

                {/* Info Grid */}
                <View style={styles.grid}>
                    <View style={styles.gridItem}>
                        <Calendar size={20} color="#001C3D" />
                        <Text style={styles.gridLabel}>Date & Time</Text>
                        <Text style={styles.gridValue}>{formatRideDate(ride.createdAt || ride.date)}</Text>
                    </View>
                    <View style={styles.gridItem}>
                        <Truck size={20} color="#001C3D" />
                        <Text style={styles.gridLabel}>Service Type</Text>
                        <Text style={styles.gridValue}>{(ride.vehicleCategory || ride.rideType || 'Standard').toUpperCase()}</Text>
                    </View>
                </View>

                {/* Financials */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Financial Summary</Text>
                    <View style={styles.fareRow}>
                        <Text style={styles.fareLabel}>Total Trip Fare</Text>
                        <Text style={styles.fareValue}>KES {fare.toFixed(2)}</Text>
                    </View>
                    <View style={styles.fareRow}>
                        <Text style={styles.fareLabel}>Commission Fee {ride.commissionRate ? `(${Number(ride.commissionRate * 100).toFixed(0)}%)` : ''}</Text>
                        <Text style={styles.fareValue}>- KES {baseCommission.toFixed(2)}</Text>
                    </View>
                    <View style={styles.fareRow}>
                        <Text style={styles.fareLabel}>VAT (16%)</Text>
                        <Text style={styles.fareValue}>- KES {vat.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.fareRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Your Final Share</Text>
                        <Text style={styles.totalValue}>KES {driverShare.toFixed(2)}</Text>
                    </View>
                    <View style={styles.paymentInfo}>
                        <CreditCard size={18} color="#64748B" />
                        <Text style={styles.paymentText}>Payment Method: {ride.paymentMethod?.toUpperCase() || 'CASH'}</Text>
                    </View>
                </View>

                {/* Customer Section */}
                <View style={styles.section}>
                    <View style={styles.customerRow}>
                        <View style={styles.avatar}>
                            <User size={24} color="#001C3D" />
                        </View>
                        <View>
                            <Text style={styles.customerName}>{ride.customerName || 'Customer'}</Text>
                            <Text style={styles.customerSub}>Client Information</Text>
                        </View>
                    </View>
                </View>

                {ride.parcelDetails && (
                    <View style={styles.section}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <Info size={20} color="#001C3D" />
                            <Text style={styles.sectionTitle}>Parcel Details</Text>
                        </View>
                        <Text style={styles.addressText}>Estimated Weight: {ride.parcelDetails.weightKg}kg</Text>
                        {ride.parcelDetails.fragile && <Text style={[styles.addressText, { color: '#FF3B30', marginTop: 4, fontWeight: '700' }]}>⚠️ Fragile Handle with Care</Text>}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
    scrollContent: { padding: 16 },
    earningsCard: { backgroundColor: '#001C3D', borderRadius: 24, padding: 32, marginBottom: 16, alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
    earningsLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    earningsAmount: { color: '#fff', fontSize: 36, fontWeight: '800', marginBottom: 16 },
    statusBadgeSmall: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    statusTextSmall: { color: '#fff', fontSize: 11, fontWeight: '700' },
    idRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 16 },
    rideIdLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
    rideIdValue: { fontSize: 12, color: '#64748B', fontWeight: '700' },
    section: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
    addressItem: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    addressContent: { flex: 1 },
    addressLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
    addressText: { fontSize: 15, color: '#1E293B', fontWeight: '500', lineHeight: 20 },
    addressLine: { width: 2, height: 16, backgroundColor: '#F1F5F9', marginLeft: 4, marginVertical: 4 },
    dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
    grid: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    gridItem: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, alignItems: 'center', gap: 4 },
    gridLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '700', marginTop: 4, textTransform: 'uppercase' },
    gridValue: { fontSize: 14, color: '#1E293B', fontWeight: '700', textAlign: 'center' },
    fareRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    fareLabel: { fontSize: 14, color: '#64748B', fontWeight: '500' },
    fareValue: { fontSize: 15, color: '#1E293B', fontWeight: '600' },
    totalRow: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16, marginTop: 4 },
    totalLabel: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    totalValue: { fontSize: 20, fontWeight: '800', color: '#4CD964' },
    paymentInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    paymentText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
    customerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    customerName: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    customerSub: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },
    distanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    distanceText: { fontSize: 14, color: '#64748B', fontWeight: '600' }
});

export default RideDetailScreen;
