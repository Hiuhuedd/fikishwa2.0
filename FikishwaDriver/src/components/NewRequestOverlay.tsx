import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, ActivityIndicator } from 'react-native';
import { MapPin, Navigation, Clock, CreditCard, X, Check } from 'lucide-react-native';

interface RideRequest {
    rideId: string;
    pickup: { lat: number, lng: number, address?: string };
    dropoff: { lat: number, lng: number, address?: string };
    fare: number;
    distanceKm: number;
    durationMin: number;
    customerName: string;
    vehicleCategory: string;
}

interface Props {
    request: RideRequest | null;
    onAccept: (rideId: string) => void;
    onReject: () => void;
}

const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Road distance is typically ~25-30% longer than straight line
    const straightLine = R * c;
    return parseFloat((straightLine * 1.3).toFixed(2));
};

const NewRequestOverlay = ({ request, onAccept, onReject }: Props) => {
    const [isAccepting, setIsAccepting] = useState(false);

    // Derived metrics for display - prioritize backend distance if it's non-zero
    const hasBackendMetric = request?.distanceKm && request.distanceKm > 0;
    const distanceVal = hasBackendMetric
        ? request.distanceKm
        : (request ? getHaversineDistance(request.pickup.lat, request.pickup.lng, request.dropoff.lat, request.dropoff.lng) : 0);

    const displayDistance = Number(distanceVal).toFixed(2);
    const displayTime = request?.durationMin || Math.ceil(Number(distanceVal) * 2.5); // Estimate 2.5 min per km

    useEffect(() => {
        if (request) {
            console.log('📬 [Driver/NewRequest] Request Data:', JSON.stringify(request, null, 2));
            setIsAccepting(false);
        }
    }, [request]);

    if (!request) return null;

    return (
        <View style={styles.container} pointerEvents="box-none">
            <View style={styles.card}>
                {/* Header with Category and Close */}
                <View style={styles.header}>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{request.vehicleCategory.toUpperCase()}</Text>
                    </View>
                    <TouchableOpacity style={styles.closeIcon} onPress={onReject} disabled={isAccepting}>
                        <X size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Customer Info */}
                <Text style={styles.customerName}>{request.customerName}</Text>

                {/* Routes - Compact */}
                <View style={styles.routeContainer}>
                    <View style={styles.routeLine}>
                        <View style={[styles.dot, { backgroundColor: '#4CD964' }]} />
                        <View style={styles.line} />
                        <View style={[styles.dot, { backgroundColor: '#FF3B30' }]} />
                    </View>
                    <View style={styles.addressContainer}>
                        <Text style={styles.addressText} numberOfLines={1}>
                            {request.pickup.address || 'Pickup'}
                        </Text>
                        <Text style={[styles.addressText, { marginTop: 12 }]} numberOfLines={1}>
                            {request.dropoff.address || 'Dropoff'}
                        </Text>
                    </View>
                </View>

                {/* Metrics Row - Compact */}
                <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                        <CreditCard size={18} color="#007AFF" />
                        <Text style={styles.infoValue}>KES {request.fare}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Navigation size={18} color="#007AFF" />
                        <Text style={styles.infoValue}>{displayDistance} km</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Clock size={18} color="#007AFF" />
                        <Text style={styles.infoValue}>{displayTime} min</Text>
                    </View>
                </View>

                {/* Action Button - Prominent */}
                <TouchableOpacity
                    style={[styles.acceptBtn, isAccepting && { opacity: 0.8 }]}
                    onPress={() => {
                        setIsAccepting(true);
                        onAccept(request.rideId);
                    }}
                    disabled={isAccepting}
                >
                    {isAccepting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Check size={22} color="#fff" />
                            <Text style={styles.acceptText}>ACCEPT RIDE</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        padding: 12,
        paddingTop: 40,
        zIndex: 9999,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryBadge: {
        backgroundColor: '#E6F0FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    categoryText: {
        color: '#007AFF',
        fontSize: 11,
        fontWeight: '800',
    },
    closeIcon: {
        padding: 4,
    },
    customerName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    routeContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    routeLine: {
        alignItems: 'center',
        width: 16,
        marginRight: 10,
        paddingTop: 4,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    line: {
        width: 1.5,
        height: 18,
        backgroundColor: '#EBEBEB',
        marginVertical: 2,
    },
    addressContainer: {
        flex: 1,
    },
    addressText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#444',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    acceptBtn: {
        height: 50,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        gap: 8,
    },
    acceptText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});

export default NewRequestOverlay;
