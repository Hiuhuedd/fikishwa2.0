import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { ChevronLeft, Wallet, TrendingUp, Clock, AlertCircle, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import api from '../../services/api';
import driverApiService from '../../services/driverApiService';

type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'Earnings'>;

const EarningsScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [earningsData, setEarningsData] = useState<any>(null);
    const [payouts, setPayouts] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            const [payoutRes] = await Promise.all([
                driverApiService.getDailyPayout()
            ]);
            if (payoutRes.data.success) {
                setEarningsData(payoutRes.data.summary);
                setPayouts(payoutRes.data.trips || []);
            }
        } catch (error) {
            console.error('Failed to fetch earnings data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    const renderTripItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.tripItem}>
            <View style={styles.tripIconContainer}>
                <Clock size={20} color="#007AFF" />
            </View>
            <View style={styles.tripDetails}>
                <Text style={styles.tripDate}>{item.time}</Text>
                <Text style={styles.tripLocation} numberOfLines={1}>{item.dropoff || 'Trip'}</Text>
            </View>
            <View style={styles.tripAmountContainer}>
                <Text style={styles.tripAmount}>KES {item.driverShare?.toFixed(2) || '0.00'}</Text>
                <ChevronRight size={16} color="#C7C7CC" />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={28} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Earnings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Total Balance</Text>
                    <Text style={styles.summaryAmount}>KES {earningsData?.totalEarnings?.toFixed(2) || '0.00'}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <TrendingUp size={16} color="#4CD964" />
                            <Text style={styles.statLabel}>Trips</Text>
                            <Text style={styles.statValue}>{earningsData?.totalTrips || 0}</Text>
                        </View>
                        <View style={[styles.statItem, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)' }]}>
                            <Clock size={16} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.statLabel}>Hours</Text>
                            <Text style={styles.statValue}>--</Text>
                        </View>
                        <View style={[styles.statItem, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)' }]}>
                            <Wallet size={16} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.statLabel}>Tips</Text>
                            <Text style={styles.statValue}>KES 0.00</Text>
                        </View>
                    </View>
                </View>

                {/* Commission Warning */}
                {earningsData?.currentOwedCommission > 0 && (
                    <View style={styles.warningCard}>
                        <AlertCircle size={20} color="#FF3B30" />
                        <View style={styles.warningTextContainer}>
                            <Text style={styles.warningTitle}>Commission Owed</Text>
                            <Text style={styles.warningSub}>KES {earningsData.currentOwedCommission.toFixed(2)} pending settlement</Text>
                        </View>
                        <TouchableOpacity style={styles.payButton} onPress={() => Alert.alert('Payment', 'Commission settlement via M-Pesa is being initialized.')}>
                            <Text style={styles.payButtonText}>Pay Now</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Recent Trips */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Activities</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={payouts}
                    renderItem={renderTripItem}
                    keyExtractor={(item) => item.rideId}
                    scrollEnabled={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No recent trips found</Text>
                        </View>
                    }
                />

                {/* Payout History */}
                {payouts.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Payout History</Text>
                        </View>
                        {payouts.map((payout, index) => (
                            <View key={index} style={styles.payoutItem}>
                                <View style={styles.payoutInfo}>
                                    <Text style={styles.payoutDate}>{new Date(payout.date).toLocaleDateString()}</Text>
                                    <Text style={styles.payoutStatus}>{payout.status}</Text>
                                </View>
                                <Text style={styles.payoutAmount}>+KES {payout.amount.toFixed(2)}</Text>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FB',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    scrollContent: {
        padding: 16,
    },
    summaryCard: {
        backgroundColor: '#007AFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    summaryLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    summaryAmount: {
        color: '#fff',
        fontSize: 36,
        fontWeight: '800',
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        paddingVertical: 12,
        width: '100%',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    statLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
    },
    statValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    warningCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF2F2',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#FFDEDE',
    },
    warningTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    warningTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FF3B30',
    },
    warningSub: {
        fontSize: 13,
        color: '#FF3B30',
        opacity: 0.8,
    },
    payButton: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    payButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    seeAllText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
    tripItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    tripIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    tripDetails: {
        flex: 1,
    },
    tripDate: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    tripLocation: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 2,
    },
    tripAmountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tripAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#8E8E93',
        fontSize: 14,
    },
    payoutItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    payoutInfo: {
        gap: 2,
    },
    payoutDate: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    payoutStatus: {
        fontSize: 12,
        color: '#4CD964',
        textTransform: 'capitalize',
    },
    payoutAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4CD964',
    },
});

export default EarningsScreen;
