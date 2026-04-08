import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    StatusBar, FlatList, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import customerApiService from '../../services/customerApiService';
import {
    ChevronLeft, MapPin, Clock, User,
    CheckCircle2, XCircle, AlertCircle, Map,
    Navigation, Star
} from 'lucide-react-native';
import { format } from 'date-fns';

const RideHistoryScreen = () => {
    const navigation = useNavigation<any>();
    const { colors, fontSizes, spacing } = useTheme();
    const [rides, setRides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        customerApiService.getHistory()
            .then((res) => {
                if (res.data.success) setRides(res.data.rides || []);
            })
            .catch((err) => {
                console.error('[RideHistory] Fetch error:', err);
            })
            .finally(() => setLoading(false));
    }, []);

    const getStatusBadge = (status: string) => {
        const s = status ? status.toLowerCase() : 'unknown';
        switch (s) {
            case 'completed':
                return {
                    label: 'Completed',
                    color: colors.success,
                    bg: colors.success + '15',
                    icon: <CheckCircle2 size={12} color={colors.success} />
                };
            case 'cancelled':
            case 'cancelled_no_drivers':
                return {
                    label: 'Cancelled',
                    color: colors.error,
                    bg: colors.error + '15',
                    icon: <XCircle size={12} color={colors.error} />
                };
            default:
                return {
                    label: s.toUpperCase(),
                    color: colors.textSecondary,
                    bg: colors.border,
                    icon: <AlertCircle size={12} color={colors.textSecondary} />
                };
        }
    };

    const renderRideItem = ({ item }: { item: any }) => {
        const status = getStatusBadge(item.status);
        const rideDate = item.date ? new Date(item.date) : null;
        const isValidDate = rideDate && !isNaN(rideDate.getTime());

        return (
            <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
                {/* Header: Date and Status */}
                <View style={styles.cardHeader}>
                    <View style={styles.dateRow}>
                        <CalendarIcon size={14} color={colors.textTertiary} />
                        <Text style={[styles.dateText, { color: colors.textTertiary, fontSize: fontSizes.xs }]}>
                            {isValidDate ? format(rideDate as Date, 'dd MMM yyyy · h:mm a') : 'Unknown Date'}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        {status.icon}
                        <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
                    </View>
                </View>

                {/* Route Section */}
                <View style={styles.routeContainer}>
                    <View style={styles.routeTimeline}>
                        <View style={[styles.dot, { backgroundColor: colors.success }]} />
                        <View style={[styles.line, { backgroundColor: colors.border }]} />
                        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                    </View>
                    <View style={styles.addressContainer}>
                        <Text style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={1}>
                            {item.pickup?.address || item.pickup || 'Pickup Location'}
                        </Text>
                        <Text style={[styles.addressText, { color: colors.textPrimary, marginTop: 14 }]} numberOfLines={1}>
                            {item.dropoff?.address || item.dropoff || 'Drop-off Location'}
                        </Text>
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.divider }]} />

                {/* Footer: Driver and Metrics */}
                <View style={styles.cardFooter}>
                    <View style={styles.driverInfo}>
                        <View style={[styles.avatarSmall, { backgroundColor: colors.primaryLight }]}>
                            <User size={14} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={[styles.driverName, { color: colors.textPrimary }]}>
                                {item.driverName || 'Driver'}
                            </Text>
                            {item.yourRating && (
                                <View style={styles.ratingRow}>
                                    <Star size={10} color="#FFB800" fill="#FFB800" />
                                    <Text style={[styles.ratingText, { color: colors.textTertiary }]}>{item.yourRating}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.tripMetrics}>
                        <View style={styles.metricItem}>
                            <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                                {item.distance ? parseFloat(item.distance).toFixed(1) : '0'} km
                            </Text>
                            <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>Dist</Text>
                        </View>
                        <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.metricItem}>
                            <Text style={[styles.metricValue, { color: colors.primary }]}>
                                KES {item.fare || 0}
                            </Text>
                            <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>Fare</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" />
            <View style={[styles.header, { paddingHorizontal: spacing.screenPadding, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, { backgroundColor: colors.backgroundCard }]}
                >
                    <ChevronLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Ride History</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Fetching your trips...</Text>
                </View>
            ) : (
                <FlatList
                    data={rides}
                    keyExtractor={(item) => item.rideId}
                    contentContainerStyle={{ padding: spacing.screenPadding, paddingBottom: 40 }}
                    ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIconContainer, { backgroundColor: colors.primaryLight }]}>
                                <Map size={40} color={colors.primary} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No rides yet</Text>
                            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                Your completed and cancelled trips will appear here.
                            </Text>
                            <TouchableOpacity
                                style={[styles.bookButton, { backgroundColor: colors.primary }]}
                                onPress={() => navigation.navigate('Home')}
                            >
                                <Text style={styles.bookButtonText}>Book a Ride</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    renderItem={renderRideItem}
                />
            )}
        </SafeAreaView>
    );
};

const CalendarIcon = Clock; // Reusing Clock as Calendar for simplicity or import specific one

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 16, borderBottomWidth: 1,
    },
    backButton: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: 20, fontWeight: '800' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14, fontWeight: '500' },
    card: {
        borderRadius: 24, padding: 18, borderWidth: 1,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 16
    },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateText: { fontWeight: '600' },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    },
    statusLabel: { fontSize: 11, fontWeight: '700' },
    routeContainer: { flexDirection: 'row', marginBottom: 16 },
    routeTimeline: { alignItems: 'center', width: 20, marginRight: 12 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    line: { width: 1.5, height: 24, marginVertical: 4 },
    addressContainer: { flex: 1 },
    addressText: { fontSize: 14, fontWeight: '500' },
    divider: { height: 1, marginVertical: 16 },
    cardFooter: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center'
    },
    driverInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatarSmall: {
        width: 32, height: 32, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center'
    },
    driverName: { fontSize: 14, fontWeight: '700' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
    ratingText: { fontSize: 10, fontWeight: '600' },
    tripMetrics: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    metricItem: { alignItems: 'flex-end' },
    metricValue: { fontSize: 14, fontWeight: '800' },
    metricLabel: { fontSize: 10, fontWeight: '500' },
    metricDivider: { width: 1, height: 20 },
    emptyContainer: {
        alignItems: 'center', marginTop: 80, paddingHorizontal: 40
    },
    emptyIconContainer: {
        width: 80, height: 80, borderRadius: 40,
        alignItems: 'center', justifyContent: 'center', marginBottom: 20
    },
    emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
    emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    bookButton: {
        paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
        shadowColor: '#D4AF37', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    bookButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});

export default RideHistoryScreen;
