import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Menu } from 'lucide-react-native';

interface StatusHeaderProps {
    isOnline: boolean;
    statusText: string;
    onMenuPress: () => void;
}

const StatusHeader = ({ isOnline, statusText, onMenuPress }: StatusHeaderProps) => {
    return (
        <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconButton} onPress={onMenuPress}>
                <Menu size={24} color="#1A1A1A" />
            </TouchableOpacity>
            <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CD964' : '#FF3B30' }]} />
                <Text style={styles.statusText}>{statusText}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 0 },
    iconButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 4 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, elevation: 4 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    statusText: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
});

export default StatusHeader;
