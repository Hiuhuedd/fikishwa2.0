import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ErrorBannerProps {
    error: string | null;
    showHelp: boolean;
    onSettings: () => void;
    onRetry: () => void;
    colors: any;
}

const ErrorBanner = ({ error, showHelp, onSettings, onRetry, colors }: ErrorBannerProps) => {
    if (!error) return null;

    return (
        <View style={[styles.locationBanner, { backgroundColor: colors.error + 'EE' }]}>
            <View style={{ flex: 1 }}>
                <Text style={styles.locationBannerText}>
                    {error}
                </Text>
                {showHelp && (
                    <Text style={[styles.locationBannerText, { fontSize: 12, marginTop: 4 }]} numberOfLines={2}>
                        Enable GPS: Settings → Location → Enable High Accuracy
                    </Text>
                )}
            </View>
            <View style={styles.buttonRow}>
                <TouchableOpacity onPress={onSettings} style={styles.bannerButton}>
                    <Text style={styles.bannerButtonText}>Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onRetry} style={styles.bannerButton}>
                    <Text style={styles.bannerButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    locationBanner: {
        position: 'absolute',
        top: 100,
        left: 20,
        right: 20,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 100,
        elevation: 10,
    },
    locationBannerText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 8,
    },
    bannerButton: {
        paddingHorizontal: 8,
    },
    bannerButtonText: {
        color: '#fff',
        fontWeight: '700',
        textDecorationLine: 'underline',
        fontSize: 12,
    },
});

export default ErrorBanner;
