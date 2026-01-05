import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../theme';
import { Driver } from '../services/driverService';

interface DriverCardProps {
    driver: Driver;
    onPress: (driver: Driver) => void;
}

const DriverCard: React.FC<DriverCardProps> = ({ driver, onPress }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return Colors.success;
            case 'pending': return Colors.pending;
            case 'rejected': return Colors.rejected;
            default: return Colors.textMuted;
        }
    };

    // Handle potential variations in ID field name (uid vs id)
    const driverId = driver.driverId || driver.uid || driver.id;

    // Handle vehicle info (might be in nested object or direct)
    const vehicle = (driver.vehicle || {}) as any;
    const carMake = driver.carMake || vehicle.make || 'Unknown Make';
    const carModel = driver.carModel || vehicle.model || 'Unknown Model';
    const carYear = driver.carYear || vehicle.year || '';
    const plate = driver.vehicleRegNo || '';

    const vehicleText = `${driver.vehicleType || 'Vehicle'} • ${carModel} • ${plate || carYear}`;

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress(driver)}
            activeOpacity={0.7}
        >
            <View style={styles.content}>
                {/* Profile Image */}
                <View style={styles.imageContainer}>
                    {driver.profilePhotoUrl ? (
                        <Image source={{ uri: driver.profilePhotoUrl }} style={styles.image} />
                    ) : (
                        <View style={[styles.image, styles.placeholderImage]}>
                            <Text style={styles.placeholderText}>{(driver.name || 'D').charAt(0).toUpperCase()}</Text>
                        </View>
                    )}
                </View>

                {/* Info */}
                <View style={styles.info}>
                    <View style={styles.headerRow}>
                        <Text style={styles.name} numberOfLines={1}>{driver.name || 'Unknown Driver'}</Text>
                        <View style={[styles.badge, { backgroundColor: getStatusColor(driver.registrationStatus || driver.status) + '20' }]}>
                            <Text style={[styles.badgeText, { color: getStatusColor(driver.registrationStatus || driver.status) }]}>
                                {driver.registrationStatus || driver.status || 'Unknown'}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.phone}>{driver.phone}</Text>

                    <Text style={styles.details}>
                        {vehicleText}
                    </Text>
                </View>

                {/* Arrow */}
                <Text style={styles.arrow}>›</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.md,
        ...Shadows.sm,
    },
    content: {
        flexDirection: 'row',
        padding: Spacing.md,
        alignItems: 'center',
    },
    imageContainer: {
        marginRight: Spacing.md,
    },
    image: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.surfaceLight,
    },
    placeholderImage: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.primary,
    },
    placeholderText: {
        color: Colors.white,
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.bold,
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    name: {
        fontSize: FontSizes.md,
        fontWeight: FontWeights.semibold,
        color: Colors.textPrimary,
        flex: 1,
        marginRight: Spacing.sm,
    },
    badge: {
        paddingHorizontal: Spacing.xs,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    badgeText: {
        fontSize: FontSizes.xs,
        fontWeight: FontWeights.medium,
        textTransform: 'capitalize',
    },
    phone: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    details: {
        fontSize: FontSizes.xs,
        color: Colors.textMuted,
    },
    arrow: {
        fontSize: FontSizes.xl,
        color: Colors.textMuted,
        marginLeft: Spacing.sm,
    },
});

export default DriverCard;
