/**
 * Loading Spinner Component
 * Full-screen or inline loading indicator
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes } from '../theme';

interface LoadingSpinnerProps {
    message?: string;
    fullScreen?: boolean;
    size?: 'small' | 'large';
    color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    message,
    fullScreen = false,
    size = 'large',
    color = Colors.primary,
}) => {
    if (fullScreen) {
        return (
            <View style={styles.fullScreenContainer}>
                <ActivityIndicator size={size} color={color} />
                {message && <Text style={styles.message}>{message}</Text>}
            </View>
        );
    }

    return (
        <View style={styles.inlineContainer}>
            <ActivityIndicator size={size} color={Colors.primary} />
            {message && <Text style={styles.message}>{message}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inlineContainer: {
        padding: Spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        marginTop: Spacing.md,
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
    },
});

export default LoadingSpinner;
