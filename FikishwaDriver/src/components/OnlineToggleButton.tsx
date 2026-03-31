import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Power } from 'lucide-react-native';

interface OnlineToggleButtonProps {
    isOnline: boolean;
    onPress: () => void;
    loading: boolean;
}

const OnlineToggleButton = ({ isOnline, onPress, loading }: OnlineToggleButtonProps) => {
    return (
        <TouchableOpacity
            style={[styles.onlineButton, isOnline ? styles.offlineButtonStyle : styles.onlineButtonStyle]}
            onPress={onPress}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <>
                    <Power size={24} color="#fff" style={{ marginRight: 12 }} />
                    <Text style={styles.onlineButtonText}>{isOnline ? 'Go Offline' : 'Go Online'}</Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    onlineButton: { height: 64, borderRadius: 32, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 8, marginTop: 16 },
    onlineButtonStyle: { backgroundColor: '#007AFF' },
    offlineButtonStyle: { backgroundColor: '#FF3B30' },
    onlineButtonText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});

export default OnlineToggleButton;
