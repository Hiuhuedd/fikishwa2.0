
import React from 'react';
import { TextInput, View, StyleSheet, TextInputProps, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { Text } from './Text';
import { Colors, Spacing, Typography } from '../theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    onRightIconPress?: () => void;
    containerStyle?: StyleProp<ViewStyle>;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    style,
    ...props
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text variant="label" color={Colors.textSecondary} style={styles.label}>
                    {label}
                </Text>
            )}

            <View style={[
                styles.inputContainer,
                error ? styles.inputError : null,
                props.editable === false ? styles.inputDisabled : null
            ]}>
                {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

                <TextInput
                    style={[styles.input, style]}
                    placeholderTextColor={Colors.textTertiary}
                    selectionColor={Colors.primary}
                    {...props}
                />

                {rightIcon && (
                    <TouchableOpacity
                        onPress={onRightIconPress}
                        disabled={!onRightIconPress}
                        style={styles.rightIcon}
                    >
                        {rightIcon}
                    </TouchableOpacity>
                )}
            </View>

            {error && (
                <Text variant="caption" color={Colors.error} style={styles.errorText}>
                    {error}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    label: {
        marginBottom: Spacing.xs,
        marginLeft: Spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundLighter,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'transparent',
        minHeight: 56,
    },
    input: {
        flex: 1,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        color: Colors.textPrimary,
        ...Typography.bodyMedium,
    },
    inputError: {
        borderColor: Colors.error,
    },
    inputDisabled: {
        opacity: 0.6,
        backgroundColor: Colors.background,
    },
    leftIcon: {
        paddingLeft: Spacing.md,
    },
    rightIcon: {
        paddingRight: Spacing.md,
    },
    errorText: {
        marginTop: Spacing.xs,
        marginLeft: Spacing.xs,
    },
});
