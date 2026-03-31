import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Animated, ActivityIndicator } from 'react-native';
import { MapPin, Navigation, Clock, CreditCard, X, Check } from 'lucide-react-native';

interface RideRequest {
    rideId: string;
    pickup: { lat: number, lng: number, address?: string };
    dropoff: { lat: number, lng: number, address?: string };
    fare: number;
    customerName: string;
    vehicleCategory: string;
}

interface Props {
    request: RideRequest | null;
    onAccept: (rideId: string) => void;
    onReject: () => void;
}

const NewRequestOverlay = ({ request, onAccept, onReject }: Props) => {
    const [timeLeft, setTimeLeft] = useState(30);
    const [isAccepting, setIsAccepting] = useState(false);
    const progress = useRef(new Animated.Value(1)).current;
    const timerRef = useRef<any>(null);

    useEffect(() => {
        if (request) {
            setTimeLeft(30);
            setIsAccepting(false);
            progress.setValue(1);
            Animated.timing(progress, {
                toValue: 0,
                duration: 30000,
                useNativeDriver: false,
            }).start();

            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        onReject();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => {
                if (timerRef.current) clearInterval(timerRef.current);
            };
        }
    }, [request]);

    if (!request) return null;

    return (
        <Modal transparent visible={!!request} animationType="slide">
            <View style={styles.container}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{request.vehicleCategory.toUpperCase()}</Text>
                        </View>
                        <View style={styles.timerContainer}>
                            <Clock size={16} color="#666" />
                            <Text style={styles.timerText}>{timeLeft}s</Text>
                        </View>
                    </View>

                    <Text style={styles.title}>New Ride Request</Text>
                    <Text style={styles.customerName}>{request.customerName}</Text>

                    <View style={styles.routeContainer}>
                        <View style={styles.routeLine}>
                            <View style={[styles.dot, { backgroundColor: '#4CD964' }]} />
                            <View style={styles.line} />
                            <View style={[styles.dot, { backgroundColor: '#FF3B30' }]} />
                        </View>
                        <View style={styles.addressContainer}>
                            <Text style={styles.addressText} numberOfLines={1}>
                                {request.pickup.address || 'Pickup Location'}
                            </Text>
                            <Text style={[styles.addressText, { marginTop: 24 }]} numberOfLines={1}>
                                {request.dropoff.address || 'Dropoff Location'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <CreditCard size={20} color="#007AFF" />
                            <Text style={styles.infoValue}>KES {request.fare}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Navigation size={20} color="#007AFF" />
                            <Text style={styles.infoValue}>2.4 km</Text>
                        </View>
                    </View>

                    <Animated.View
                        style={[
                            styles.progressBar,
                            { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }
                        ]}
                    />

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.rejectBtn} onPress={onReject} disabled={isAccepting}>
                            <X size={24} color="#FF3B30" />
                            <Text style={styles.rejectText}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.acceptBtn, isAccepting && { opacity: 0.8 }]}
                            onPress={() => {
                                if (timerRef.current) {
                                    clearInterval(timerRef.current);
                                    timerRef.current = null;
                                }
                                setIsAccepting(true);
                                onAccept(request.rideId);
                            }}
                            disabled={isAccepting}
                        >
                            {isAccepting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Check size={24} color="#fff" />
                                    <Text style={styles.acceptText}>Accept</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

import { useRef } from 'react';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    categoryBadge: {
        backgroundColor: '#F0F7FF',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        color: '#007AFF',
        fontSize: 12,
        fontWeight: '700',
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timerText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    customerName: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
    },
    routeContainer: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    routeLine: {
        alignItems: 'center',
        width: 20,
        marginRight: 12,
        paddingTop: 6,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    line: {
        width: 2,
        height: 30,
        backgroundColor: '#E1E1E5',
        marginVertical: 4,
    },
    addressContainer: {
        flex: 1,
    },
    addressText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1A1A1A',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24,
        backgroundColor: '#F5F5F7',
        borderRadius: 16,
        padding: 16,
    },
    infoItem: {
        alignItems: 'center',
        gap: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    progressBar: {
        height: 4,
        backgroundColor: '#007AFF',
        borderRadius: 2,
        marginBottom: 24,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    rejectBtn: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF5F5',
        gap: 8,
    },
    rejectText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '700',
    },
    acceptBtn: {
        flex: 2,
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        gap: 8,
    },
    acceptText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});

export default NewRequestOverlay;
