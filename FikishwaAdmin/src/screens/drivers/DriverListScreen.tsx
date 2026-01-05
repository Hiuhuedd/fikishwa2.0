import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme';
import DriverCard from '../../components/DriverCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getAllDrivers, getPendingDrivers, Driver } from '../../services/driverService';

type FilterType = 'pending' | 'all';

const DriverListScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [filter, setFilter] = useState<FilterType>('pending');
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);

    const fetchDrivers = async () => {
        try {
            setError(null);
            if (!refreshing) setLoading(true); // Don't show full loader on pull-to-refresh

            let response;
            if (filter === 'pending') {
                response = await getPendingDrivers();
            } else {
                response = await getAllDrivers();
            }

            if (response.success) {
                setDrivers(response.drivers);
            } else {
                setError('Failed to load drivers');
            }
        } catch (err: any) {
            console.error('Error fetching drivers:', err);
            setError(err.message || 'Failed to load drivers');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDrivers();
    }, [filter]); // Re-fetch when filter changes

    // Filter local results by search query
    useEffect(() => {
        if (!searchQuery) {
            setFilteredDrivers(drivers);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = drivers.filter(
                (driver) =>
                    driver.name.toLowerCase().includes(query) ||
                    driver.phone.includes(query)
            );
            setFilteredDrivers(filtered);
        }
    }, [searchQuery, drivers]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDrivers();
    }, [filter]);

    const openDrawer = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    const navigateToDetails = (driver: Driver) => {
        // Navigate to details screen
        navigation.navigate('DriverDetails', { driverId: driver.driverId });
    };

    const renderItem = ({ item }: { item: Driver }) => (
        <DriverCard driver={item} onPress={navigateToDetails} />
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
                    <Text style={styles.menuIcon}>☰</Text>
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.headerTitle}>Drivers</Text>
                </View>
                <TouchableOpacity onPress={fetchDrivers} style={styles.refreshButton}>
                    <Text style={styles.refreshIcon}>↻</Text>
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, filter === 'pending' && styles.activeTab]}
                    onPress={() => setFilter('pending')}
                >
                    <Text style={[styles.tabText, filter === 'pending' && styles.activeTabText]}>
                        Pending
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, filter === 'all' && styles.activeTab]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.tabText, filter === 'all' && styles.activeTabText]}>
                        All Drivers
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name or phone..."
                    placeholderTextColor={Colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Text style={styles.clearIcon}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Content */}
            {loading && !refreshing ? (
                <LoadingSpinner message={`Loading ${filter} drivers...`} />
            ) : error ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchDrivers}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredDrivers}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.driverId || Math.random().toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={Colors.primary}
                            colors={[Colors.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No drivers found</Text>
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
    refreshButton: {
        padding: Spacing.sm,
    },
    refreshIcon: {
        fontSize: 24,
        color: Colors.primary,
    },
    tabsContainer: {
        flexDirection: 'row',
        padding: Spacing.md,
        backgroundColor: Colors.surface,
        marginBottom: 1,
    },
    tab: {
        flex: 1,
        paddingVertical: Spacing.sm,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: Colors.primary,
    },
    tabText: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        fontWeight: FontWeights.medium,
    },
    activeTabText: {
        color: Colors.primary,
        fontWeight: FontWeights.bold,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        margin: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        height: 50,
    },
    searchIcon: {
        fontSize: 18,
        marginRight: Spacing.sm,
        color: Colors.textSecondary,
    },
    searchInput: {
        flex: 1,
        fontSize: FontSizes.md,
        color: Colors.textPrimary,
    },
    clearIcon: {
        fontSize: 18,
        color: Colors.textSecondary,
        padding: Spacing.xs,
    },
    listContent: {
        padding: Spacing.md,
        paddingBottom: Spacing.xxl,
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

export default DriverListScreen;
