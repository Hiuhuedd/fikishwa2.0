import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    StatusBar, FlatList, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import api from '../../services/api';
import customerApiService from '../../services/customerApiService';
import { API_ENDPOINTS } from '../../config/api';
import { ChevronLeft, MapPin, Clock } from 'lucide-react-native';
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
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" />
            <View style={[styles.header, { paddingHorizontal: spacing.screenPadding, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Ride History</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={rides}
                    keyExtractor={(item) => item.rideId}
                    contentContainerStyle={{ padding: spacing.screenPadding, gap: 12 }}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 60 }}>
                            <Text style={{ fontSize: 48, marginBottom: 16 }}>🛣️</Text>
                            <Text style={{ color: colors.textSecondary, fontSize: fontSizes.md }}>No rides yet</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
                            <View style={styles.cardHeader}>
                                <Text style={{ color: colors.textTertiary, fontSize: fontSizes.xs }}>
                                    {item.completedAt ? format(new Date(item.completedAt), 'dd MMM yyyy · h:mm a') : ''}
                                </Text>
                                <Text style={[styles.fare, { color: colors.primary }]}>KES {item.finalFare || item.fare || 0}</Text>
                            </View>
                            <View style={styles.routeRow}>
                                <View style={[styles.dot, { backgroundColor: colors.success }]} />
                                <Text style={[styles.routeText, { color: colors.textSecondary }]} numberOfLines={1}>
                                    {item.pickup?.address || 'Pickup'}
                                </Text>
                            </View>
                            <View style={[styles.connector, { backgroundColor: colors.border }]} />
                            <View style={styles.routeRow}>
                                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                                <Text style={[styles.routeText, { color: colors.textPrimary }]} numberOfLines={1}>
                                    {item.dropoff?.address || 'Dropoff'}
                                </Text>
                            </View>
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 16, borderBottomWidth: 1,
    },
    title: { fontSize: 18, fontWeight: '700' },
    card: {
        borderRadius: 18, padding: 16, borderWidth: 1,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    fare: { fontWeight: '800', fontSize: 16 },
    routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    connector: { width: 1, height: 10, marginLeft: 4, marginVertical: 2 },
    routeText: { flex: 1, fontSize: 13 },
});

export default RideHistoryScreen;
