import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../theme';
import { Customer } from '../services/customerService';

interface CustomerCardProps {
    customer: Customer;
    onPress?: (customer: Customer) => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onPress }) => {

    // Decide what to show for image
    const renderProfileImage = () => {
        if (customer.profilePhotoUrl) {
            return <Image source={{ uri: customer.profilePhotoUrl }} style={styles.image} />;
        }
        return (
            <View style={[styles.image, styles.placeholderImage]}>
                <Text style={styles.placeholderText}>{(customer.name || 'C').charAt(0).toUpperCase()}</Text>
            </View>
        );
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress && onPress(customer)}
            activeOpacity={0.7}
            disabled={!onPress}
        >
            <View style={styles.content}>
                {/* Profile Image */}
                <View style={styles.imageContainer}>
                    {renderProfileImage()}
                </View>

                {/* Info */}
                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>{customer.name || 'Unknown User'}</Text>
                    <Text style={styles.phone}>{customer.phone}</Text>

                    <View style={styles.statsRow}>
                        {customer.totalRides !== undefined && (
                            <Text style={styles.statsText}>🚗 {customer.totalRides} Rides</Text>
                        )}
                        {customer.rating !== undefined && (
                            <Text style={[styles.statsText, { marginLeft: Spacing.md }]}>⭐ {customer.rating.toFixed(1)}</Text>
                        )}
                    </View>

                    <Text style={styles.date}>Joined {new Date(customer.createdAt || customer.joinedAt || Date.now()).toLocaleDateString()}</Text>
                </View>
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
    name: {
        fontSize: FontSizes.md,
        fontWeight: FontWeights.semibold,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    phone: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    statsText: {
        fontSize: FontSizes.xs,
        color: Colors.primaryLight,
        fontWeight: FontWeights.medium,
    },
    date: {
        fontSize: 10,
        color: Colors.textMuted,
    }
});

export default CustomerCard;
