import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, ActivityIndicator } from 'react-native';
import { ChevronLeft, MapPin, Calendar, Clock, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import driverApiService from '../../services/driverApiService';

const HistoryScreen = () => {
    const navigation = useNavigation();
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await driverApiService.getRideHistory();
                if (response.data.success) {
                    setRides(response.data.rides);
                }
            } catch (error) {
                console.error('Failed to fetch ride history:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const RideItem = ({ ride }: any) => {
        if (!ride) return null;
        return (
            <TouchableOpacity style={styles.rideItem}>
                <View style={styles.rideHeader}>
                    <View style={styles.dateContainer}>
                        <Calendar size={14} color="#64748B" />
                        <Text style={styles.dateText}>
                            {ride.createdAt ? new Date(ride.createdAt).toLocaleDateString() : 'N/A'}
                        </Text>
                    </View>
                    <Text style={styles.amountText}>
                        KES {ride.fare ? Number(ride.fare).toFixed(2) : '0.00'}
                    </Text>
                </View>

                <View style={styles.locationContainer}>
                    <View style={styles.dotsContainer}>
                        <View style={styles.dot} />
                        <View style={styles.line} />
                        <View style={[styles.dot, { backgroundColor: '#001C3D' }]} />
                    </View>
                    <View style={styles.addressList}>
                        <Text style={styles.addressText} numberOfLines={1}>
                            {ride.pickupAddress || 'Unknown Pickup'}
                        </Text>
                        <Text style={styles.addressText} numberOfLines={1}>
                            {ride.destinationAddress || 'Unknown Destination'}
                        </Text>
                    </View>
                </View>

                <View style={styles.rideFooter}>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>
                            {(ride.status || 'unknown').toUpperCase()}
                        </Text>
                    </View>
                    <ChevronRight size={18} color="#CBD5E1" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={28} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ride History</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#001C3D" />
                </View>
            ) : (
                <FlatList
                    data={rides}
                    keyExtractor={(item: any) => item._id}
                    renderItem={({ item }) => <RideItem ride={item} />}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No rides found in your history.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backButton: { padding: 4, marginRight: 16 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16 },
    rideItem: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
    rideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    dateContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    amountText: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    locationContainer: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    dotsContainer: { alignItems: 'center', paddingVertical: 4 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CBD5E1' },
    line: { width: 2, flex: 1, backgroundColor: '#F1F5F9', marginVertical: 2 },
    addressList: { flex: 1, gap: 12 },
    addressText: { fontSize: 14, color: '#475569', fontWeight: '500' },
    rideFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 12 },
    statusBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
    emptyContainer: { flex: 1, alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 16, color: '#94A3B8' }
});

export default HistoryScreen;
