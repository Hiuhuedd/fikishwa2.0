import React, { useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    Modal,
    Animated,
    Dimensions,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { Colors, Spacing, FontSizes } from '../theme';
import { MapPin, Navigation, Clock, DollarSign } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RideRequestModalProps {
    visible: boolean;
    rideData: {
        rideId: string;
        pickup: { address: string };
        dropoff: { address: string };
        fare: number;
        distance: string;
        estimateTime: string;
        customerName: string;
    } | null;
    onAccept: () => void;
    onDecline: () => void;
}

const RideRequestModal: React.FC<RideRequestModalProps> = ({
    visible,
    rideData,
    onAccept,
    onDecline,
}) => {
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    if (!rideData) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onDecline}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.modalContainer,
                        { transform: [{ translateY: slideAnim }] }
                    ]}
                >
                    <View style={styles.handle} />

                    <View style={styles.animationContainer}>
                        <LottieView
                            source={require('../assets/animations/ride_request.json')}
                            autoPlay
                            loop
                            style={styles.lottie}
                        />
                    </View>

                    <View style={styles.header}>
                        <Text style={styles.title}>New Ride Request</Text>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>Standard</Text>
                        </View>
                    </View>

                    <View style={styles.customerInfo}>
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>{rideData.customerName.charAt(0)}</Text>
                        </View>
                        <View>
                            <Text style={styles.customerName}>{rideData.customerName}</Text>
                            <Text style={styles.ratingText}>⭐ 4.9 (Recent)</Text>
                        </View>
                    </View>

                    <View style={styles.rideDetails}>
                        <View style={styles.locationContainer}>
                            <View style={styles.locationMarkerContainer}>
                                <View style={styles.dot} />
                                <View style={styles.line} />
                                <MapPin size={16} color={Colors.error} />
                            </View>
                            <View style={styles.locationTextContainer}>
                                <Text style={styles.locationLabel}>PICKUP</Text>
                                <Text style={styles.locationValue} numberOfLines={1}>
                                    {rideData.pickup.address}
                                </Text>
                                <View style={styles.spacer} />
                                <Text style={styles.locationLabel}>DROPOFF</Text>
                                <Text style={styles.locationValue} numberOfLines={1}>
                                    {rideData.dropoff.address}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.metricsRow}>
                            <View style={styles.metricItem}>
                                <Navigation size={20} color={Colors.textSecondary} />
                                <Text style={styles.metricValue}>{rideData.distance || '2.4 km'}</Text>
                                <Text style={styles.metricLabel}>Distance</Text>
                            </View>
                            <View style={styles.metricItem}>
                                <Clock size={20} color={Colors.textSecondary} />
                                <Text style={styles.metricValue}>{rideData.estimateTime || '8 min'}</Text>
                                <Text style={styles.metricLabel}>Arrival</Text>
                            </View>
                            <View style={styles.metricItem}>
                                <DollarSign size={20} color={Colors.primary} />
                                <Text style={[styles.metricValue, { color: Colors.primary }]}>
                                    KES {rideData.fare}
                                </Text>
                                <Text style={styles.metricLabel}>Est. Fare</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.declineButton}
                            onPress={onDecline}
                        >
                            <Text style={styles.declineButtonText}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.acceptButton}
                            onPress={onAccept}
                        >
                            <Text style={styles.acceptButtonText}>Accept</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: Colors.backgroundLight,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: Spacing.lg,
        paddingBottom: 40,
        minHeight: 450,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 20,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: Colors.textTertiary,
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: Spacing.md,
    },
    animationContainer: {
        height: 120,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    lottie: {
        width: 150,
        height: 150,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: FontSizes.xxl,
        fontWeight: 'bold',
        color: Colors.white,
    },
    categoryBadge: {
        backgroundColor: 'rgba(29, 185, 84, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderColor: Colors.primary,
        borderWidth: 1,
    },
    categoryText: {
        color: Colors.primary,
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.backgroundLighter,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    avatarText: {
        color: Colors.white,
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
    },
    customerName: {
        color: Colors.white,
        fontSize: FontSizes.md,
        fontWeight: 'bold',
    },
    ratingText: {
        color: Colors.textSecondary,
        fontSize: FontSizes.sm,
        marginTop: 2,
    },
    rideDetails: {
        backgroundColor: Colors.backgroundLighter,
        borderRadius: 20,
        padding: Spacing.md,
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    locationContainer: {
        flexDirection: 'row',
        paddingHorizontal: 5,
        marginBottom: Spacing.lg,
    },
    locationMarkerContainer: {
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 5,
        marginRight: 15,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary,
    },
    line: {
        width: 2,
        flex: 1,
        backgroundColor: Colors.textTertiary,
        marginVertical: 4,
    },
    locationTextContainer: {
        flex: 1,
    },
    locationLabel: {
        color: Colors.textTertiary,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    locationValue: {
        color: Colors.white,
        fontSize: FontSizes.md,
        marginTop: 2,
    },
    spacer: {
        height: 15,
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: Spacing.md,
    },
    metricItem: {
        alignItems: 'center',
        flex: 1,
    },
    metricValue: {
        color: Colors.white,
        fontSize: FontSizes.md,
        fontWeight: 'bold',
        marginTop: 4,
    },
    metricLabel: {
        color: Colors.textSecondary,
        fontSize: 10,
        marginTop: 2,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    declineButton: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.error,
    },
    declineButtonText: {
        color: Colors.error,
        fontSize: FontSizes.md,
        fontWeight: 'bold',
    },
    acceptButton: {
        flex: 2,
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    acceptButtonText: {
        color: Colors.white,
        fontSize: FontSizes.md,
        fontWeight: 'bold',
    },
});

export default RideRequestModal;
