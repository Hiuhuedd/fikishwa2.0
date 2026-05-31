import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MapPin, Navigation, Clock, CreditCard, X, ChevronRight } from 'lucide-react-native';

interface RideRequest {
    rideId: string;
    pickup: { lat: number, lng: number, address?: string };
    dropoff: { lat: number, lng: number, address?: string };
    // Fare — may arrive as 'fare' or 'estimatedFare'
    fare?: number;
    estimatedFare?: number;
    // Distance — may arrive as distanceKm (number) or distance (string e.g. '4.2 km')
    distanceKm?: number;
    distance?: string;
    // Duration — may arrive as durationMin (number) or estimateTime (string e.g. '12 min')
    durationMin?: number;
    estimateTime?: string;
    customerName: string;
    vehicleCategory?: string;
    rideType?: string;
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
    const straightLine = R * c;
    return parseFloat((straightLine * 1.3).toFixed(2));
};

const NewRequestOverlay = ({ request, onAccept, onReject }: Props) => {
    const [isAccepting, setIsAccepting] = useState(false);

    // Resolve fare — handle 'fare', 'estimatedFare', or missing
    const resolvedFare = request?.fare ?? request?.estimatedFare ?? 0;
    const displayFare = isNaN(Number(resolvedFare)) ? 0 : Number(resolvedFare);

    // Resolve distance — handle distanceKm (number) or distance (string '4.2 km')
    const rawDistanceKm = request?.distanceKm;
    const rawDistanceStr = request?.distance ? parseFloat(request.distance) : null;
    const hasBackendMetric = rawDistanceKm && rawDistanceKm > 0;
    const distanceVal = hasBackendMetric
        ? rawDistanceKm
        : rawDistanceStr && !isNaN(rawDistanceStr)
            ? rawDistanceStr
            : (request ? getHaversineDistance(request.pickup.lat, request.pickup.lng, request.dropoff.lat, request.dropoff.lng) : 0);

    const displayDistance = Number(distanceVal).toFixed(2);

    // Resolve duration — handle durationMin (number) or estimateTime (string '12 min')
    const rawDuration = request?.durationMin
        ?? (request?.estimateTime ? parseInt(request.estimateTime) : null)
        ?? Math.ceil(Number(distanceVal) * 2.5);
    const displayTime = isNaN(Number(rawDuration)) ? Math.ceil(Number(distanceVal) * 2.5) : rawDuration;

    useEffect(() => {
        if (request) {
            setIsAccepting(false);
        }
    }, [request]);

    if (!request) return null;

    return (
        <View style={styles.container} pointerEvents="auto">
            <View style={styles.executiveCard}>
                {/* Header Sequence */}
                <View style={styles.header}>
                    <View style={styles.badgeExecutive}>
                        <View style={styles.pulseDot} />
                        <Text style={styles.badgeText}>
                            {(request.vehicleCategory || request.rideType || 'STANDARD').toUpperCase()} REQUEST
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.rejectBtn} onPress={onReject} disabled={isAccepting}>
                        <X size={18} color="#111" />
                    </TouchableOpacity>
                </View>

                {/* Rider Name */}
                <Text style={styles.customerName}>{request.customerName}</Text>

                {/* Routes Sequence */}
                <View style={styles.routeContainer}>
                    <View style={styles.routeTimeline}>
                        <View style={[styles.timelineDot, { backgroundColor: '#111' }]} />
                        <View style={styles.timelineLine} />
                        <View style={[styles.timelineDot, { backgroundColor: '#0A84FF', borderRadius: 2 }]} />
                    </View>
                    <View style={styles.addressContainer}>
                        <Text style={styles.addressText} numberOfLines={1}>
                            {request.pickup.address || 'Pickup Location'}
                        </Text>
                        <Text style={[styles.addressText, { marginTop: 16 }]} numberOfLines={1}>
                            {request.dropoff.address || 'Dropoff Location'}
                        </Text>
                    </View>
                </View>

                {/* Metrics Box */}
                <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>FARE</Text>
                        <Text style={styles.metricValue}>KES {displayFare.toLocaleString('en-US')}</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>DISTANCE</Text>
                        <Text style={styles.metricValue}>{displayDistance} km</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>EST. TIME</Text>
                        <Text style={styles.metricValue}>{displayTime} min</Text>
                    </View>
                </View>

                {/* Executive Accept Button */}
                <TouchableOpacity
                    style={[styles.acceptBtn, isAccepting && styles.acceptBtnDisabled]}
                    onPress={() => {
                        setIsAccepting(true);
                        onAccept(request.rideId);
                    }}
                    disabled={isAccepting}
                    activeOpacity={0.8}
                >
                    {isAccepting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <View style={styles.btnContent}>
                            <Text style={styles.acceptText}>ACCEPT RIDE</Text>
                            <View style={styles.btnArrow}>
                                <ChevronRight size={18} color="#111" />
                            </View>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Full screen dark overlay
        justifyContent: 'flex-start',
        padding: 16,
        paddingTop: 60,
        zIndex: 9999,
    },
    executiveCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 16,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    badgeExecutive: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#34C759',
        marginRight: 6,
    },
    badgeText: {
        color: '#111',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    rejectBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    customerName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111',
        letterSpacing: -0.5,
        marginBottom: 20,
    },
    routeContainer: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    routeTimeline: {
        alignItems: 'center',
        width: 16,
        marginRight: 12,
        paddingTop: 4,
    },
    timelineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    timelineLine: {
        width: 1.5,
        height: 24,
        backgroundColor: '#E5E5EA',
        marginVertical: 4,
    },
    addressContainer: {
        flex: 1,
    },
    addressText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111',
        lineHeight: 20,
    },
    metricsGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    metricItem: {
        flex: 1,
        alignItems: 'center',
    },
    metricDivider: {
        width: 1,
        height: 32,
        backgroundColor: '#E5E5EA',
    },
    metricLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 1,
        marginBottom: 4,
    },
    metricValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111',
    },
    acceptBtn: {
        backgroundColor: '#111',
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    acceptBtnDisabled: {
        opacity: 0.7,
        alignItems: 'center',
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 16,
    },
    acceptText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
    btnArrow: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default NewRequestOverlay;
