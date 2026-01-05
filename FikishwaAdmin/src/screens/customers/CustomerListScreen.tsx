import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme';
import CustomerCard from '../../components/CustomerCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getAllCustomers, Customer } from '../../services/customerService';

const CustomerListScreen: React.FC = () => {
    const navigation = useNavigation();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);

    const fetchCustomers = async () => {
        try {
            setError(null);
            if (!refreshing) setLoading(true); // Don't show full loader on pull-to-refresh

            const response = await getAllCustomers();

            if (response.success) {
                setCustomers(response.customers || []);
            } else {
                setError('Failed to load customers');
            }
        } catch (err: any) {
            console.error('Error fetching customers:', err);
            setError(err.message || 'Failed to load customers');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []); // Initial load

    // Filter local results by search query
    useEffect(() => {
        if (!searchQuery) {
            setFilteredCustomers(customers);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = customers.filter(
                (customer) =>
                    customer.name.toLowerCase().includes(query) ||
                    customer.phone.includes(query)
            );
            setFilteredCustomers(filtered);
        }
    }, [searchQuery, customers]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchCustomers();
    }, []);

    const openDrawer = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    const renderItem = ({ item }: { item: Customer }) => (
        <CustomerCard customer={item} onPress={() => { /* Potential detail view later */ }} />
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
                    <Text style={styles.menuIcon}>☰</Text>
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.headerTitle}>Customers</Text>
                </View>
                <TouchableOpacity onPress={fetchCustomers} style={styles.refreshButton}>
                    <Text style={styles.refreshIcon}>↻</Text>
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
                <LoadingSpinner message="Loading customers..." />
            ) : error ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchCustomers}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredCustomers}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id || item.uid || Math.random().toString()}
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
                            <Text style={styles.emptyText}>No customers found</Text>
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

export default CustomerListScreen;
