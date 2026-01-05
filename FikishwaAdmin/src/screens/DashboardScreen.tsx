import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    StatusBar,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../theme';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getPayoutStatistics, PayoutStatistics } from '../services/payoutService';
import { getRideStatistics, RideStats } from '../services/rideService';

const DashboardScreen: React.FC = () => {
    console.log('DashboardScreen: Rendering...');
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<PayoutStatistics | null>(null);
    const [rideStats, setRideStats] = useState<RideStats | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchStatistics = async () => {
        try {
            setError(null);
            const response = await getPayoutStatistics();
            if (response.success) {
                setStats(response.stats);
            }

            const rideResponse = await getRideStatistics();
            if (rideResponse.success) {
                setRideStats(rideResponse.stats);
            }
        } catch (err: any) {
            console.error('Error fetching statistics:', err);
            setError(err.message || 'Failed to load statistics');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStatistics();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchStatistics();
    }, []);

    const openDrawer = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    const formatCurrency = (amount: number): string => {
        return `KES ${amount.toLocaleString()}`;
    };

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading dashboard..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
                    <Text style={styles.menuIcon}>☰</Text>
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.headerTitle}>Dashboard</Text>
                    <Text style={styles.headerSubtitle}>Fikishwa Admin</Text>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
            >
                {error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>⚠️ {error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                            <Text style={styles.retryText}>Tap to retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Statistics Grid */}
                        <Text style={styles.sectionTitle}>Financial Overview</Text>
                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <StatCard
                                    title="Commission Owed"
                                    value={formatCurrency(stats?.totalOwedCommission || 0)}
                                    icon="💰"
                                    color={Colors.warning}
                                    subtitle="From drivers"
                                />
                            </View>
                            <View style={styles.statItem}>
                                <StatCard
                                    title="Pending Payouts"
                                    value={formatCurrency(stats?.totalPendingPayouts || 0)}
                                    icon="📤"
                                    color={Colors.info}
                                    subtitle="To drivers"
                                />
                            </View>
                            <View style={styles.statItem}>
                                <StatCard
                                    title="Drivers Owing"
                                    value={stats?.driversOwingCount || 0}
                                    icon="🚗"
                                    color={Colors.error}
                                    subtitle="Need to pay"
                                />
                            </View>
                            <View style={styles.statItem}>
                                <StatCard
                                    title="Drivers Owed"
                                    value={stats?.driversOwedCount || 0}
                                    icon="✅"
                                    color={Colors.success}
                                    subtitle="Awaiting payout"
                                />
                            </View>
                        </View>

                        {/* Ride Statistics */}
                        <Text style={styles.sectionTitle}>Ride Overview</Text>
                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <StatCard
                                    title="Total Rides"
                                    value={rideStats?.totalRides || 0}
                                    icon="🚖"
                                    color={Colors.primary}
                                />
                            </View>
                            <View style={styles.statItem}>
                                <StatCard
                                    title="Active Rides"
                                    value={rideStats?.activeRides || 0}
                                    icon="⚡"
                                    color={Colors.warning}
                                    subtitle="Now live"
                                />
                            </View>
                            <View style={styles.statItem}>
                                <StatCard
                                    title="Completed"
                                    value={rideStats?.completedRides || 0}
                                    icon="🏁"
                                    color={Colors.success}
                                />
                            </View>
                        </View>

                        {/* Quick Actions */}
                        <Text style={styles.sectionTitle}>Quick Actions</Text>
                        <View style={styles.actionsContainer}>
                            <TouchableOpacity
                                style={styles.actionCard}
                                onPress={() => navigation.navigate('Rides' as never)}
                            >
                                <Text style={styles.actionIcon}>🚕</Text>
                                <Text style={styles.actionText}>Manage Rides</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.actionCard}
                                onPress={() => navigation.navigate('Drivers' as never)}
                            >
                                <Text style={styles.actionIcon}>🚗</Text>
                                <Text style={styles.actionText}>Manage Drivers</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.actionCard}
                                onPress={() => navigation.navigate('Customers' as never)}
                            >
                                <Text style={styles.actionIcon}>👥</Text>
                                <Text style={styles.actionText}>View Customers</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.actionCard}
                                onPress={() => navigation.navigate('Payouts' as never)}
                            >
                                <Text style={styles.actionIcon}>💳</Text>
                                <Text style={styles.actionText}>Payouts</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.actionCard}
                                onPress={() => navigation.navigate('Promotions' as never)}
                            >
                                <Text style={styles.actionIcon}>🎁</Text>
                                <Text style={styles.actionText}>Promotions</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </ScrollView>
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
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
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
    headerText: {
        flex: 1,
    },
    headerTitle: {
        fontSize: FontSizes.xl,
        fontWeight: FontWeights.bold,
        color: Colors.textPrimary,
    },
    headerSubtitle: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: Spacing.lg,
    },
    sectionTitle: {
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.semibold,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
        marginTop: Spacing.md,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -Spacing.xs,
    },
    statItem: {
        width: '50%',
        paddingHorizontal: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    errorContainer: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        alignItems: 'center',
    },
    errorText: {
        fontSize: FontSizes.md,
        color: Colors.error,
        marginBottom: Spacing.md,
        textAlign: 'center',
    },
    retryButton: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
    },
    retryText: {
        fontSize: FontSizes.md,
        color: Colors.white,
        fontWeight: FontWeights.medium,
    },
    actionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -Spacing.xs,
    },
    actionCard: {
        width: '48%',
        marginHorizontal: '1%',
        marginBottom: Spacing.sm,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    actionIcon: {
        fontSize: 28,
        marginBottom: Spacing.sm,
    },
    actionText: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        fontWeight: FontWeights.medium,
    },
});

export default DashboardScreen;

