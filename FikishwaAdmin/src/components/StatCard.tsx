/**
 * Reusable StatCard Component
 * Displays a statistic with icon, value, and title
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../theme';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: string;
    color?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    color = Colors.primary,
    trend,
    trendValue,
}) => {
    const getTrendColor = () => {
        switch (trend) {
            case 'up':
                return Colors.success;
            case 'down':
                return Colors.error;
            default:
                return Colors.textSecondary;
        }
    };

    const getTrendIcon = () => {
        switch (trend) {
            case 'up':
                return '↑';
            case 'down':
                return '↓';
            default:
                return '';
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {icon && <Text style={styles.icon}>{icon}</Text>}
                <Text style={styles.title} numberOfLines={2}>{title}</Text>
            </View>

            <Text style={styles.value}>{value}</Text>

            {subtitle && (
                <Text style={styles.subtitle}>{subtitle}</Text>
            )}

            {trend && trendValue && (
                <View style={styles.trendContainer}>
                    <Text style={[styles.trendText, { color: getTrendColor() }]}>
                        {getTrendIcon()} {trendValue}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        ...Shadows.sm,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    icon: {
        fontSize: FontSizes.xl,
        marginRight: Spacing.sm,
    },
    title: {
        flex: 1,
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        fontWeight: FontWeights.medium,
    },
    value: {
        fontSize: FontSizes.xxl,
        fontWeight: FontWeights.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: FontSizes.xs,
        color: Colors.textMuted,
    },
    trendContainer: {
        marginTop: Spacing.sm,
    },
    trendText: {
        fontSize: FontSizes.sm,
        fontWeight: FontWeights.medium,
    },
});

export default StatCard;
