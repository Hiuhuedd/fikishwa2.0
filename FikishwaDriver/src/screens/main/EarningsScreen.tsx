import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    Dimensions
} from 'react-native';
import { Colors, Spacing, FontSizes } from '../../theme';
import {
    ChevronLeft,
    TrendingUp,
    Calendar,
    Wallet,
    ChevronRight,
    MapPin,
    Clock,
    DollarSign
} from 'lucide-react-native';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const EarningsScreen = ({ navigation }: any) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [summary, setSummary] = useState<any>(null);
    const [trips, setTrips] = useState<any[]>([]);

    useEffect(() => {
        fetchEarnings();
    }, []);

    const fetchEarnings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/driver/payout/daily');
            if (response.data.success) {
                setSummary(response.data.summary);
                setTrips(response.data.trips);
            }
        } catch (error) {
            console.error('Fetch earnings error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchEarnings();
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <ChevronLeft size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Earnings</Text>
            <View style={{ width: 40 }} />
        </View>
    );

    const renderSummaryCards = () => (
        <View style={styles.summaryContainer}>
            <View style={styles.mainCard}>
                <Text style={styles.cardLabel}>TODAY'S EARNINGS</Text>
                <Text style={styles.earningsAmount}>
                    KES {summary?.totalDriverShare || 0}
                </Text>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <TrendingUp size={16} color={Colors.primary} />
                        <Text style={styles.statText}>{summary?.totalTrips || 0} Trips</Text>
                    </View>
                    <View style={[styles.statItem, { marginLeft: Spacing.md }]}>
                        <Clock size={16} color={Colors.primary} />
                        <Text style={styles.statText}>4.2 hrs</Text>
                    </View>
                </View>
            </View>

            <View style={styles.walletRow}>
                <View style={styles.walletCard}>
                    <Wallet size={20} color={Colors.primary} />
                    <View style={{ marginLeft: 10 }}>
                        <Text style={styles.walletLabel}>Owed Commission</Text>
                        <Text style={styles.walletValue}>KES {summary?.currentOwedCommission || 0}</Text>
                    </View>
                </View>
                <View style={[styles.walletCard, { marginLeft: Spacing.sm }]}>
                    <DollarSign size={20} color={Colors.primary} />
                    <View style={{ marginLeft: 10 }}>
                        <Text style={styles.walletLabel}>Pending Payout</Text>
                        <Text style={styles.walletValue}>KES {summary?.pendingPayout || 0}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderTripItem = (trip: any) => (
        <TouchableOpacity key={trip.rideId} style={styles.tripCard}>
            <View style={styles.tripHeader}>
                <Text style={styles.tripTime}>{trip.time}</Text>
                <Text style={styles.tripAmount}>+ KES {trip.driverShare}</Text>
            </View>
            <View style={styles.addressLine}>
                <View style={[styles.dot, { backgroundColor: Colors.success }]} />
                <Text style={styles.addressText} numberOfLines={1}>{trip.pickup}</Text>
            </View>
            <View style={styles.verticalDash} />
            <View style={styles.addressLine}>
                <View style={[styles.dot, { backgroundColor: Colors.error }]} />
                <Text style={styles.addressText} numberOfLines={1}>{trip.dropoff}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            {renderHeader()}

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                {renderSummaryCards()}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Trips</Text>
                    <TouchableOpacity>
                        <Text style={styles.viewAll}>See All</Text>
                    </TouchableOpacity>
                </View>

                {trips.length > 0 ? (
                    trips.map(renderTripItem)
                ) : (
                    <View style={styles.emptyContainer}>
                        <Calendar size={48} color={Colors.textTertiary} />
                        <Text style={styles.emptyText}>No trips completed yet today.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: 60,
        paddingBottom: Spacing.md,
    },
    headerTitle: {
        color: Colors.white,
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.backgroundLighter,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: 40,
    },
    summaryContainer: {
        marginTop: Spacing.md,
    },
    mainCard: {
        backgroundColor: Colors.primary,
        borderRadius: 24,
        padding: Spacing.xl,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    cardLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    earningsAmount: {
        color: Colors.white,
        fontSize: 36,
        fontWeight: 'bold',
        marginVertical: Spacing.xs,
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: Spacing.sm,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    walletRow: {
        flexDirection: 'row',
        marginTop: Spacing.md,
    },
    walletCard: {
        flex: 1,
        backgroundColor: Colors.backgroundLighter,
        borderRadius: 16,
        padding: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    walletLabel: {
        color: Colors.textSecondary,
        fontSize: 10,
    },
    walletValue: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: 'bold',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.xxl,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        color: Colors.white,
        fontSize: FontSizes.md,
        fontWeight: 'bold',
    },
    viewAll: {
        color: Colors.primary,
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    tripCard: {
        backgroundColor: Colors.backgroundLighter,
        borderRadius: 16,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    tripHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    tripTime: {
        color: Colors.textSecondary,
        fontSize: 12,
    },
    tripAmount: {
        color: Colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    addressLine: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 10,
    },
    addressText: {
        color: Colors.textPrimary,
        fontSize: 13,
        flex: 1,
    },
    verticalDash: {
        width: 1,
        height: 8,
        backgroundColor: Colors.border,
        marginLeft: 2.5,
        marginVertical: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        color: Colors.textSecondary,
        marginTop: Spacing.md,
    }
});

export default EarningsScreen;
