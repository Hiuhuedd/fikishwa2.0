import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Home, Briefcase, Star } from 'lucide-react-native';

interface SavedPlaceSelectorProps {
    colors: any;
    insets: any;
    selectingPlaceType: string | null;
    previewAddress: string;
    isReverseGeocoding: boolean;
    onSave: () => void;
}

const SavedPlaceSelector = ({
    colors,
    insets,
    selectingPlaceType,
    previewAddress,
    isReverseGeocoding,
    onSave,
}: SavedPlaceSelectorProps) => {
    return (
        <View style={[styles.selectionFooter, { backgroundColor: colors.backgroundCard, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.addressContainer}>
                <View style={[styles.iconCircle, { backgroundColor: colors.primary + '10' }]}>
                    {selectingPlaceType === 'Home' ? (
                        <Home size={20} color={colors.primary} />
                    ) : selectingPlaceType === 'Work' ? (
                        <Briefcase size={20} color={colors.primary} />
                    ) : (
                        <Star size={20} color={colors.primary} />
                    )}
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.addressLabel, { color: colors.textTertiary }]}>LOCATION ADDRESS</Text>
                    {isReverseGeocoding ? (
                        <View style={styles.loadingRow}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={{ color: colors.textSecondary }}>Checking address...</Text>
                        </View>
                    ) : (
                        <Text style={[styles.addressText, { color: colors.textPrimary }]} numberOfLines={2}>
                            {previewAddress || 'Select a point on the map'}
                        </Text>
                    )}
                </View>
            </View>

            <TouchableOpacity
                style={[styles.confirmSaveBtn, { backgroundColor: colors.primary }]}
                onPress={onSave}
                disabled={isReverseGeocoding || !previewAddress}
            >
                <Text style={styles.confirmSaveText}>Save {selectingPlaceType}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    selectionFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        zIndex: 30,
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        marginLeft: 16,
    },
    addressLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 4,
    },
    addressText: {
        fontSize: 15,
        fontWeight: '700',
        lineHeight: 20,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    confirmSaveBtn: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    confirmSaveText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
});

export default SavedPlaceSelector;
