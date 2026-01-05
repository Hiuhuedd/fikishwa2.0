import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../../theme';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
    getPayoutStatistics,
    getDriversOwing,
    getDriversOwed,
    PayoutStatistics,
    DriverOwing,
    DriverOwed,
} from '../../services/payoutService';
import { formatCurrency } from '../../utils/formatters';

type TabType = 'owing' | 'owed';

const PayoutScreen: React.FC = () => {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState<TabType>('owing');

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [stats, setStats] = useState<PayoutStatistics | null>(null);
    const [owingDrivers, setOwingDrivers] = useState<DriverOwing[]>([]);
    const [owedDrivers, setOwedDrivers] = useState<DriverOwed[]>([]);

    const fetchData = async () => {
        try {
            if (!refreshing) setLoading(true);
            setError(null);

            // Fetch all data in parallel or sequence
            // Stats
            const statsRes = await getPayoutStatistics();
            if (statsRes.success) setStats(statsRes.stats);

            // Lists
            if (activeTab === 'owing') {
                const owingRes = await getDriversOwing();
                if (owingRes.success) setOwingDrivers(owingRes.drivers);
            } else {
                const owedRes = await getDriversOwed();
                if (owedRes.success) setOwedDrivers(owedRes.drivers);
            }

        } catch (err: any) {
            console.error('Error fetching payout data:', err);
            setError(err.message || 'Failed to load payout data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [activeTab]);

    const openDrawer = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    const renderSummaryCards = () => {
        if (!stats) return null;

        return (
            <View style={styles.summaryContainer}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Total Owed Commission</Text>
                    <Text style={[styles.summaryValue, { color: Colors.error }]}>
                        KES {formatCurrency(stats.totalOwedCommission)}
                    </Text>
                    <Text style={styles.summarySubtext}>{stats.driversOwingCount} Drivers owing</Text>
                </View>

                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Total Pending Payouts</Text>
                    <Text style={[styles.summaryValue, { color: Colors.warning }]}>
                        KES {formatCurrency(stats.totalPendingPayouts)}
                    </Text>
                    <Text style={styles.summarySubtext}>{stats.driversOwedCount} Drivers waiting</Text>
                </View>
            </View>
        );
    };

    const renderOwingItem = ({ item }: { item: DriverOwing }) => {
        // Assuming assuming formatCurrency handles numbers properly
        // If formatCurrency expects number, fine. If currency symbol included, double check.
        // Our util usually returns string with commas.

        return (
            <View style={styles.listItem}>
                <View style={styles.listContent}>
                    <View style={styles.row}>
                        <Text style={styles.driverName}>{item.name}</Text>
                        <Text style={styles.negativeAmount}>-{formatCurrency(item.owedCommission)}</Text>
                    </View>
                    <Text style={styles.driverPhone}>{item.phone}</Text>
                    <Text style={styles.lastTrip}>Last trip: {item.lastTripAt ? new Date(item.lastTripAt).toLocaleDateString() : 'Never'}</Text>
                </View>
            </View>
        );
    };

    const renderOwedItem = ({ item }: { item: DriverOwed }) => (
        <View style={styles.listItem}>
            <View style={styles.listContent}>
                <View style={styles.row}>
                    <Text style={styles.driverName}>{item.name}</Text>
                    <Text style={styles.positiveAmount}>+{formatCurrency(item.pendingPayout)}</Text>
                </View>
                <Text style={styles.driverPhone}>{item.phone}</Text>
                <Text style={styles.prefText}>Preference: {item.payoutPreference || 'M-Pesa'}</Text>
            </View>
            <TouchableOpacity style={styles.payButton}>
                <Text style={styles.payButtonText}>Pay</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
                    <Text style={styles.menuIcon}>☰</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payouts</Text>
                <TouchableOpacity onPress={fetchData} style={styles.refreshButton}>
                    <Text style={styles.refreshIcon}>↻</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {renderSummaryCards()}

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'owing' && styles.activeTab]}
                        onPress={() => setActiveTab('owing')}
                    >
                        <Text style={[styles.tabText, activeTab === 'owing' && styles.activeTabText]}>
                            Owing Commission
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'owed' && styles.activeTab]}
                        onPress={() => setActiveTab('owed')}
                    >
                        <Text style={[styles.tabText, activeTab === 'owed' && styles.activeTabText]}>
                            Pending Payouts
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* List */}
                {loading && !refreshing ? (
                    <LoadingSpinner message="Loading financial data..." />
                ) : error ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={activeTab === 'owing' ? owingDrivers : owedDrivers}
                        renderItem={activeTab === 'owing' ? renderOwingItem as any : renderOwedItem as any}
                        keyExtractor={(item: any) => item.driverId || Math.random().toString()}
                        contentContainerStyle={styles.listContainer}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No records found</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    menuButton: {
        padding: Spacing.sm,
        marginRight: Spacing.md,
    },
    menuIcon: {
        fontSize: 24,
        color: Colors.textPrimary,
    },
    headerTitle: {
        flex: 1,
        fontSize: FontSizes.xl,
        fontWeight: FontWeights.bold,
        color: Colors.textPrimary,
    },
    refreshButton: {
        padding: Spacing.sm,
    },
    refreshIcon: {
        fontSize: 24,
        color: Colors.primary,
    },
    refreshText: {
        color: Colors.primary,
    },
    content: {
        flex: 1,
    },
    summaryContainer: {
        flexDirection: 'row',
        padding: Spacing.md,
        justifyContent: 'space-between',
    },
    summaryCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginHorizontal: Spacing.xs,
        alignItems: 'center',
        ...Shadows.sm,
    },
    summaryLabel: {
        fontSize: FontSizes.xs,
        color: Colors.textSecondary,
        marginBottom: 4,
        textAlign: 'center',
    },
    summaryValue: {
        fontSize: FontSizes.md,
        fontWeight: FontWeights.bold,
        marginBottom: 2,
    },
    summarySubtext: {
        fontSize: 10,
        color: Colors.textMuted,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        marginBottom: Spacing.sm,
    },
    tab: {
        flex: 1,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: Colors.primary,
    },
    tabText: {
        color: Colors.textSecondary,
        fontSize: FontSizes.sm,
        fontWeight: FontWeights.medium,
    },
    activeTabText: {
        color: Colors.primary,
        fontWeight: FontWeights.bold,
    },
    listContainer: {
        padding: Spacing.md,
        paddingBottom: Spacing.xxl,
    },
    listItem: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...Shadows.sm,
    },
    listContent: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    driverName: {
        fontSize: FontSizes.md,
        fontWeight: FontWeights.semibold,
        color: Colors.textPrimary,
    },
    negativeAmount: {
        fontSize: FontSizes.md,
        fontWeight: FontWeights.bold,
        color: Colors.error,
    },
    positiveAmount: {
        fontSize: FontSizes.md,
        fontWeight: FontWeights.bold,
        color: Colors.success,
    },
    driverPhone: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    lastTrip: {
        fontSize: FontSizes.xs,
        color: Colors.textMuted,
        fontStyle: 'italic',
    },
    prefText: {
        fontSize: FontSizes.xs,
        color: Colors.textMuted,
    },
    payButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        marginLeft: Spacing.md,
    },
    payButtonText: {
        color: Colors.white,
        fontSize: FontSizes.sm,
        fontWeight: FontWeights.bold,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    errorText: {
        color: Colors.error,
        fontSize: FontSizes.md,
        marginBottom: Spacing.md,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    retryText: {
        color: Colors.white,
        fontWeight: FontWeights.bold,
    },
    emptyContainer: {
        padding: Spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        color: Colors.textSecondary,
        fontSize: FontSizes.md,
    },
});

export default PayoutScreen;
