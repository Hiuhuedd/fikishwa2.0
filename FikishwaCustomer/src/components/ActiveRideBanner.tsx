import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Navigation, ArrowRight } from 'lucide-react-native';

interface ActiveRideBannerProps {
    colors: any;
    fontSizes: any;
    activeRide: any;
    onPress: () => void;
}

const ActiveRideBanner = ({ colors, fontSizes, activeRide, onPress }: ActiveRideBannerProps) => {
    if (!activeRide) return null;

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.activeRideTile, { backgroundColor: colors.primary }]}
            onPress={onPress}
        >
            <View style={styles.tileLeft}>
                <View style={styles.iconCircle}>
                    <Navigation size={18} color={colors.primary} />
                </View>
                <View style={styles.tileContent}>
                    <Text style={styles.tileTitle}>Active Ride</Text>
                    <Text style={styles.tileSub}>Status: {activeRide.status.toUpperCase()}</Text>
                </View>
            </View>
            <View style={styles.tileRight}>
                <Text style={styles.tapText}>TAP TO TRACK</Text>
                <ArrowRight size={16} color="#fff" />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    activeRideTile: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    tileLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tileContent: {
        justifyContent: 'center',
    },
    tileTitle: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 15,
    },
    tileSub: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 1,
    },
    tileRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tapText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
});

export default ActiveRideBanner;
