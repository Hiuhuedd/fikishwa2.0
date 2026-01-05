
import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Text } from './Text';
import { Colors, Spacing } from '../theme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

interface BadgeProps {
    label: string;
    variant?: BadgeVariant;
    style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
    label,
    variant = 'default',
    style,
}) => {
    const getBackgroundColor = () => {
        switch (variant) {
            case 'success': return 'rgba(29, 185, 84, 0.15)';
            case 'warning': return 'rgba(255, 165, 0, 0.15)';
            case 'error': return 'rgba(233, 20, 41, 0.15)';
            case 'info': return 'rgba(46, 119, 208, 0.15)';
            default: return Colors.surface;
        }
    };

    const getTextColor = () => {
        switch (variant) {
            case 'success': return Colors.success;
            case 'warning': return Colors.warning;
            case 'error': return Colors.error;
            case 'info': return Colors.info;
            default: return Colors.textSecondary;
        }
    };

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: getBackgroundColor() },
                style,
            ]}
        >
            <Text
                variant="label"
                color={getTextColor()}
                style={styles.text}
            >
                {label}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    text: {
        textTransform: 'uppercase',
        fontWeight: '700',
        fontSize: 10,
    },
});
