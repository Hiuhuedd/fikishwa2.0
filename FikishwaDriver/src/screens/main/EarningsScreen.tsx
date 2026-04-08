import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { ChevronLeft, Wallet, TrendingUp, Clock, AlertCircle, ChevronRight, CreditCard, Copy, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import api from '../../services/api';
import driverApiService from '../../services/driverApiService';
import { useAuthStore } from '../../store/useAuthStore';
import PremiumModal from '../../components/PremiumModal';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'Earnings'>;
const EarningsScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const user = useAuthStore(state => state.user);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [earningsData, setEarningsData] = useState<any>(null);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [paymentInstructions, setPaymentInstructions] = useState<any>(null);
    const [showPaybillModal, setShowPaybillModal] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const copyToClipboard = async (text: string, field: string) => {
        await Clipboard.setStringAsync(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const fetchData = async () => {
        try {
            const [payoutRes] = await Promise.all([
                driverApiService.getDailyPayout()
            ]);
            if (payoutRes.data.success) {
                setEarningsData(payoutRes.data.summary);
                setPayouts(payoutRes.data.trips || []);
                setPaymentInstructions(payoutRes.data.paymentInstructions);
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
                <Text style={styles.tripAmount}>KES {(item.amount || item.driverShare || 0).toFixed(2)}</Text>
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
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.headerTitle}>Earnings</Text>
                    {earningsData?.driverName && (
                        <Text style={styles.headerSubtitle}>{earningsData.driverName}</Text>
                    )}
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Total Balance</Text>
                    <Text style={styles.summaryAmount}>KES {(earningsData?.totalEarnings || 0).toFixed(2)}</Text>

                    <View style={styles.todayContainer}>
                        <Text style={styles.todayLabel}>Today's Earnings: </Text>
                        <Text style={styles.todayValue}>KES {(earningsData?.todayDriverShare || 0).toFixed(2)}</Text>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <TrendingUp size={16} color="#4CD964" />
                            <Text style={styles.statLabel}>Today</Text>
                            <Text style={styles.statValue}>{earningsData?.totalTrips || 0}</Text>
                        </View>
                        <View style={[styles.statItem, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)' }]}>
                            <TrendingUp size={16} color="#4CD964" />
                            <Text style={styles.statLabel}>All Time</Text>
                            <Text style={styles.statValue}>{earningsData?.allTimeTrips || 0}</Text>
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
                            <Text style={styles.warningSub}>KES {(earningsData.currentOwedCommission || 0).toFixed(2)} pending settlement</Text>
                        </View>
                        <TouchableOpacity style={styles.payButton} onPress={() => setShowPaybillModal(true)}>
                            <Text style={styles.payButtonText}>Pay Now</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Paybill Modal */}
                <PremiumModal
                    visible={showPaybillModal}
                    onClose={() => setShowPaybillModal(false)}
                    title="Settlement via M-Pesa"
                    heightPercentage={0.7}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.mpesaBadge}>
                            <Text style={styles.mpesaText}>LIPA NA M-PESA</Text>
                        </View>

                        <Text style={styles.modalSubTitle}>Follow these steps to settle your commission:</Text>

                        <View style={styles.instructionList}>
                            <Text style={styles.instructionItem}>1. Go to M-Pesa menu</Text>
                            <Text style={styles.instructionItem}>2. Select Lipa na M-Pesa</Text>
                            <Text style={styles.instructionItem}>3. Select Paybill</Text>
                        </View>

                        <View style={styles.paybillDetails}>
                            <View style={styles.detailRow}>
                                <View>
                                    <Text style={styles.detailLabel}>Business Number</Text>
                                    <Text style={styles.detailValue}>{paymentInstructions?.paybill || "4005473"}</Text>
                                </View>
                                <TouchableOpacity onPress={() => copyToClipboard(paymentInstructions?.paybill || "4005473", 'paybill')}>
                                    {copiedField === 'paybill' ? <Check size={20} color="#4CD964" /> : <Copy size={20} color="#001C3D" />}
                                </TouchableOpacity>
                            </View>

                            <View style={styles.detailRow}>
                                <View>
                                    <Text style={styles.detailLabel}>Account Number</Text>
                                    <Text style={styles.detailValue}>{paymentInstructions?.accountNumber || user?.phone || 'Your Phone Number'}</Text>
                                </View>
                                <TouchableOpacity onPress={() => {
                                    const acc = paymentInstructions?.accountNumber || user?.phone;
                                    if (acc) copyToClipboard(acc, 'account');
                                }}>
                                    {copiedField === 'account' ? <Check size={20} color="#4CD964" /> : <Copy size={20} color="#001C3D" />}
                                </TouchableOpacity>
                            </View>

                            <View style={styles.detailRow}>
                                <View>
                                    <Text style={styles.detailLabel}>Amount</Text>
                                    <Text style={styles.detailValue}>KES {(earningsData?.currentOwedCommission || 0).toFixed(2)}</Text>
                                </View>
                                <CreditCard size={20} color="#8E8E93" />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.doneButton}
                            onPress={() => setShowPaybillModal(false)}
                        >
                            <Text style={styles.doneButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </PremiumModal>

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
                                    <Text style={styles.payoutDate}>{payout.date ? new Date(payout.date).toLocaleDateString() : 'N/A'}</Text>
                                    <Text style={styles.payoutStatus}>{payout.status || 'Paid'}</Text>
                                </View>
                                <Text style={styles.payoutAmount}>+KES {(payout.amount || payout.driverShare || 0).toFixed(2)}</Text>
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
    headerSubtitle: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '500',
    },
    scrollContent: {
        padding: 16,
    },
    summaryCard: {
        backgroundColor: '#001C3D',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#001C3D',
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
        marginBottom: 12,
    },
    todayContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    todayLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '500',
    },
    todayValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
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
        color: '#001C3D',
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
        backgroundColor: '#E6F0FF',
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
    modalContent: {
        paddingTop: spacing.md,
    },
    mpesaBadge: {
        backgroundColor: '#4CD964',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: spacing.md,
    },
    mpesaText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 12,
    },
    modalSubTitle: {
        fontSize: 15,
        color: colors.textSecondary,
        marginBottom: spacing.md,
        lineHeight: 20,
    },
    instructionList: {
        marginBottom: spacing.lg,
    },
    instructionItem: {
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '600',
        marginBottom: 6,
    },
    paybillDetails: {
        backgroundColor: colors.backgroundHover,
        borderRadius: spacing.borderRadius,
        padding: spacing.md,
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    doneButton: {
        backgroundColor: '#001C3D',
        paddingVertical: spacing.md,
        borderRadius: spacing.borderRadius,
        alignItems: 'center',
    },
    doneButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default EarningsScreen;
