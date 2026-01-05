
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography, Spacing } from '../theme';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    variant = 'primary',
    size = 'medium',
    loading = false,
    leftIcon,
    rightIcon,
    style,
    textStyle,
    onPress,
    disabled,
    ...props
}) => {
    const handlePress = (e: any) => {
        if (loading || disabled) return;

        // Add haptic feedback
        ReactNativeHapticFeedback.trigger('impactLight');

        if (onPress) {
            onPress(e);
        }
    };

    const getContainerStyle = () => {
        switch (variant) {
            case 'primary':
                return styles.primaryContainer;
            case 'secondary':
                return styles.secondaryContainer;
            case 'outline':
                return styles.outlineContainer;
            case 'ghost':
                return styles.ghostContainer;
            case 'danger':
                return styles.dangerContainer;
            default:
                return styles.primaryContainer;
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case 'primary':
                return styles.primaryText;
            case 'secondary':
                return styles.secondaryText;
            case 'outline':
                return styles.outlineText;
            case 'ghost':
                return styles.ghostText;
            case 'danger':
                return styles.dangerText;
            default:
                return styles.primaryText;
        }
    };

    const getSizeStyle = () => {
        switch (size) {
            case 'small':
                return styles.smallContainer;
            case 'medium':
                return styles.mediumContainer;
            case 'large':
                return styles.largeContainer;
            default:
                return styles.mediumContainer;
        }
    };

    const getTextSizeStyle = () => {
        switch (size) {
            case 'small':
                return styles.smallText;
            case 'medium':
                return styles.mediumText;
            case 'large':
                return styles.largeText;
            default:
                return styles.mediumText;
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.baseContainer,
                getContainerStyle(),
                getSizeStyle(),
                disabled && styles.disabledContainer,
                style,
            ]}
            onPress={handlePress}
            activeOpacity={0.8}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? Colors.textPrimary : Colors.textInverse} />
            ) : (
                <>
                    {leftIcon}
                    <Text
                        style={[
                            styles.baseText,
                            getTextStyle(),
                            getTextSizeStyle(),
                            disabled && styles.disabledText,
                            leftIcon && { marginLeft: Spacing.sm },
                            rightIcon && { marginRight: Spacing.sm },
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                    {rightIcon}
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    baseContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 30, // Pill shape
    },
    baseText: {
        ...Typography.button,
    },

    // Sizes
    smallContainer: {
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    mediumContainer: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    largeContainer: {
        paddingVertical: 16,
        paddingHorizontal: 32,
    },
    smallText: {
        fontSize: 12,
    },
    mediumText: {
        fontSize: 14,
    },
    largeText: {
        fontSize: 16,
    },

    // Variants
    primaryContainer: {
        backgroundColor: Colors.primary,
    },
    primaryText: {
        color: Colors.textInverse,
    },

    secondaryContainer: {
        backgroundColor: Colors.surface,
    },
    secondaryText: {
        color: Colors.textPrimary,
    },

    outlineContainer: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.textSecondary,
    },
    outlineText: {
        color: Colors.textPrimary,
    },

    ghostContainer: {
        backgroundColor: 'transparent',
    },
    ghostText: {
        color: Colors.textPrimary,
    },

    dangerContainer: {
        backgroundColor: 'rgba(233, 20, 41, 0.1)',
        borderWidth: 1,
        borderColor: Colors.error,
    },
    dangerText: {
        color: Colors.error,
    },

    // Disabled
    disabledContainer: {
        backgroundColor: Colors.disabled,
        borderColor: 'transparent',
    },
    disabledText: {
        color: Colors.textSecondary,
    },
});
