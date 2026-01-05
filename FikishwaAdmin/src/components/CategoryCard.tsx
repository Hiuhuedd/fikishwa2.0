import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Switch } from 'react-native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../theme';
import { VehicleCategory } from '../services/categoryService';
import { formatCurrency } from '../utils/formatters';

interface CategoryCardProps {
    category: VehicleCategory;
    onEdit: (category: VehicleCategory) => void;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onEdit, onToggleStatus }) => {

    return (
        <View style={styles.container}>
            {/* Header Image & Status */}
            <View style={styles.header}>
                <View style={styles.imageContainer}>
                    {category.image ? (
                        <Image source={{ uri: category.image }} style={styles.image} resizeMode="cover" />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Text style={styles.placeholderText}>{(category.name || 'V').charAt(0)}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.headerContent}>
                    <Text style={styles.name}>{category.name}</Text>
                    <Text style={styles.description} numberOfLines={1}>
                        {category.maxPassengers} passengers • {category.description || 'Standard ride'}
                    </Text>
                </View>

                <Switch
                    value={category.isActive}
                    onValueChange={() => onToggleStatus(category.categoryId, category.isActive)}
                    trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
                    thumbColor={category.isActive ? Colors.primary : Colors.textMuted}
                />
            </View>

            {/* Pricing Grid */}
            <View style={styles.pricingGrid}>
                <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Base Fare</Text>
                    <Text style={styles.priceValue}>{formatCurrency(category.baseFare)}</Text>
                </View>
                <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Per KM</Text>
                    <Text style={styles.priceValue}>{formatCurrency(category.perKmRate)}</Text>
                </View>
                <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Per Min</Text>
                    <Text style={styles.priceValue}>{formatCurrency(category.perMinuteRate)}</Text>
                </View>
                <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Min Fare</Text>
                    <Text style={styles.priceValue}>{formatCurrency(category.minimumFare)}</Text>
                </View>
            </View>

            {/* Edit Action */}
            <TouchableOpacity
                style={styles.editButton}
                onPress={() => onEdit(category)}
                activeOpacity={0.7}
            >
                <Text style={styles.editButtonText}>Edit Details</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        ...Shadows.sm,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    imageContainer: {
        width: 60,
        height: 60,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.primary + '20',
        width: '100%',
    },
    placeholderText: {
        fontSize: FontSizes.xl,
        fontWeight: FontWeights.bold,
        color: Colors.primary,
    },
    headerContent: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.bold,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    description: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
    },
    pricingGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
        padding: Spacing.sm,
        marginBottom: Spacing.md,
    },
    priceItem: {
        width: '25%', // 4 items per row
        alignItems: 'center',
        paddingVertical: Spacing.xs,
    },
    priceLabel: {
        fontSize: 10,
        color: Colors.textMuted,
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    priceValue: {
        fontSize: FontSizes.sm,
        fontWeight: FontWeights.semibold,
        color: Colors.textPrimary,
    },
    editButton: {
        width: '100%',
        paddingVertical: Spacing.sm,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        marginTop: Spacing.xs,
    },
    editButtonText: {
        fontSize: FontSizes.sm,
        fontWeight: FontWeights.medium,
        color: Colors.primary,
    }
});

export default CategoryCard;
