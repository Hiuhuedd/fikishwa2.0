import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../../theme';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getAllRides, Ride } from '../../services/rideService';

const RidesScreen: React.FC = () => {
    const navigation = useNavigation();
    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDocId, setLastDocId] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const fetchRides = async (refresh = false) => {
        try {
            if (refresh) setLoading(true); // Initial load or pull-to-refresh

            const currentLastId = refresh ? null : lastDocId;
            const response = await getAllRides(20, currentLastId);

            if (response.success) {
                if (refresh) {
                    setRides(response.rides);
                } else {
                    setRides(prev => [...prev, ...response.rides]);
                }
                setLastDocId(response.lastDocId);
                setHasMore(response.hasMore);
            }
        } catch (error) {
            console.error('Error fetching rides:', error);
            Alert.alert('Error', 'Failed to load rides');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchRides(true);
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchRides(true);
    }, []);

    const loadMore = () => {
        if (!loadingMore && hasMore && !loading) {
            setLoadingMore(true);
            fetchRides(false);
        }
    };

    const openDrawer = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return Colors.success;
            case 'cancelled':
            case 'cancelled_no_drivers': return Colors.error;
            case 'in_progress':
            case 'started': return Colors.warning;
            case 'accepted':
            case 'arrived': return Colors.info;
            default: return Colors.textSecondary;
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        // Handle Firestore timestamp or ISO string
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderItem = ({ item }: { item: Ride }) => (
        <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.row}>
                    <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
                            {item.status.replace(/_/g, ' ').toUpperCase()}
                        </Text>
                    </View>
                </View>
                <Text style={styles.fare}>KES {(item.finalFare || item.estimatedFare || 0).toLocaleString()}</Text>
            </View>

            <View style={styles.routeContainer}>
                <View style={styles.locationRow}>
                    <View style={[styles.dot, styles.pickupDot]} />
                    <Text style={styles.address} numberOfLines={1}>{item.pickup?.address || 'Unknown Pickup'}</Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.locationRow}>
                    <View style={[styles.dot, styles.dropoffDot]} />
                    <Text style={styles.address} numberOfLines={1}>{item.dropoff?.address || 'Unknown Dropoff'}</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.driverInfo}>
                    {item.driverDetails ? `🚗 ${item.driverDetails.name}` : 'Waiting for Driver'}
                </Text>
                <Text style={styles.customerInfo}>
                    👤 {item.customerName || 'Customer'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderFooter = () => {
        if (!loadingMore) return <View style={{ height: 20 }} />;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={Colors.primary} />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
                    <Text style={styles.menuIcon}>☰</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Rides</Text>
            </View>

            {loading && !refreshing ? (
                <LoadingSpinner fullScreen message="Loading rides..." />
            ) : (
                <FlatList
                    data={rides}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.rideId}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                    }
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No rides found</Text>
                        </View>
                    }
                />
            )}
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
        fontSize: FontSizes.xl,
        fontWeight: FontWeights.bold,
        color: Colors.textPrimary,
    },
    listContent: {
        padding: Spacing.md,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        ...Shadows.sm,
    },
    cardHeader: {
        marginBottom: Spacing.sm,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    date: {
        fontSize: FontSizes.xs,
        color: Colors.textSecondary,
    },
    badge: {
        paddingHorizontal: Spacing.xs,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: FontWeights.bold,
    },
    fare: {
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.bold,
        color: Colors.textPrimary,
        alignSelf: 'flex-end',
    },
    routeContainer: {
        marginLeft: Spacing.xs,
        marginBottom: Spacing.md,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: Spacing.sm,
    },
    pickupDot: {
        backgroundColor: Colors.success,
    },
    dropoffDot: {
        backgroundColor: Colors.error,
    },
    routeLine: {
        width: 2,
        height: 15,
        backgroundColor: Colors.border,
        marginLeft: 4,
    },
    address: {
        flex: 1,
        fontSize: FontSizes.md,
        color: Colors.textPrimary,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: Spacing.sm,
    },
    driverInfo: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
    },
    customerInfo: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
    },
    footerLoader: {
        paddingVertical: Spacing.lg,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: Spacing.xxl,
    },
    emptyText: {
        color: Colors.textMuted,
        fontSize: FontSizes.md,
    },
});

export default RidesScreen;
