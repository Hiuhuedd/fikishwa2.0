
import React from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, Dimensions } from 'react-native';
import { Colors, Spacing } from '../theme';

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'default' | 'elevated' | 'outlined';
    onPress?: () => void;
    padding?: keyof typeof Spacing | number;
}

export const Card: React.FC<CardProps> = ({
    children,
    style,
    variant = 'default',
    onPress,
    padding = 'cardPadding',
}) => {
    const getContainerStyle = () => {
        switch (variant) {
            case 'elevated':
                return styles.elevated;
            case 'outlined':
                return styles.outlined;
            default: // default is flat but with background
                return styles.default;
        }
    };

    const paddingValue = typeof padding === 'number' ? padding : Spacing[padding as keyof typeof Spacing] || Spacing.cardPadding;

    const Container = onPress ? TouchableOpacity : View;

    return (
        <Container
            style={[
                styles.base,
                getContainerStyle(),
                { padding: paddingValue },
                style,
            ]}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            {children}
        </Container>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    default: {
        backgroundColor: Colors.backgroundLight,
    },
    elevated: {
        backgroundColor: Colors.backgroundLighter,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.border,
    },
});
