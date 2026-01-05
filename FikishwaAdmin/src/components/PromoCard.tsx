import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../theme';
import { Promotion } from '../services/promotionService';
import { formatCurrency, formatDate } from '../utils/formatters';

interface PromoCardProps {
    promotion: Promotion;
    onDelete?: (code: string) => void;
}

const PromoCard: React.FC<PromoCardProps> = ({ promotion, onDelete }) => {
    const isExpired = promotion.expiryDate ? new Date(promotion.expiryDate) < new Date() : false;

    return (
        <View style={[styles.container, isExpired && styles.expiredContainer]}>
            <View style={styles.leftContent}>
                <Text style={styles.code}>{promotion.code}</Text>
                <Text style={styles.description} numberOfLines={2}>
                    {promotion.description || `${promotion.value}${promotion.type === 'percentage' ? '%' : ' KES'} off`}
                </Text>

                <View style={styles.badgeRow}>
                    <View style={[styles.badge, styles.typeBadge]}>
                        <Text style={styles.badgeText}>{promotion.type}</Text>
                    </View>
                    {isExpired ? (
                        <View style={[styles.badge, styles.expiredBadge]}>
                            <Text style={[styles.badgeText, styles.expiredText]}>Expired</Text>
                        </View>
                    ) : (
                        <View style={[styles.badge, styles.activeBadge]}>
                            <Text style={[styles.badgeText, styles.activeText]}>Active</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.expiry}>
                    Expires: {promotion.expiryDate ? formatDate(promotion.expiryDate) : 'Never'}
                    {promotion.usageLimit ? ` • Limit: ${promotion.usageLimit}` : ''}
                </Text>
            </View>

            <View style={styles.rightContent}>
                <Text style={styles.value}>
                    {promotion.type === 'fixed' ? formatCurrency(promotion.value) : `${promotion.value}%`}
                </Text>
                <Text style={styles.valueLabel}>OFF</Text>

                {onDelete && (
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => onDelete(promotion.code)}
                    >
                        <Text style={styles.deleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        ...Shadows.sm,
    },
    expiredContainer: {
        backgroundColor: Colors.surfaceLight,
        opacity: 0.8,
    },
    leftContent: {
        flex: 1,
        marginRight: Spacing.md,
    },
    rightContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: Spacing.md,
        borderLeftWidth: 1,
        borderLeftColor: Colors.border,
        minWidth: 80,
    },
    code: {
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.bold,
        color: Colors.textPrimary,
        marginBottom: 4,
        letterSpacing: 1,
    },
    description: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    badgeRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    badge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
        marginRight: Spacing.sm,
        borderWidth: 1,
    },
    typeBadge: {
        borderColor: Colors.border,
    },
    expiredBadge: {
        borderColor: Colors.error,
        backgroundColor: Colors.error + '20',
    },
    activeBadge: {
        borderColor: Colors.success,
        backgroundColor: Colors.success + '20',
    },
    badgeText: {
        fontSize: 10,
        color: Colors.textMuted,
        textTransform: 'capitalize',
    },
    activeText: {
        color: Colors.success,
        fontWeight: FontWeights.bold,
    },
    expiredText: {
        color: Colors.error,
        fontWeight: FontWeights.bold,
    },
    expiry: {
        fontSize: 10,
        color: Colors.textMuted,
    },
    value: {
        fontSize: FontSizes.xl,
        fontWeight: FontWeights.bold,
        color: Colors.primary,
    },
    valueLabel: {
        fontSize: 10,
        color: Colors.textSecondary,
        fontWeight: FontWeights.bold,
        marginBottom: Spacing.md,
    },
    deleteButton: {
        padding: Spacing.sm,
    },
    deleteIcon: {
        fontSize: 18,
        color: Colors.error,
    }
});

export default PromoCard;
