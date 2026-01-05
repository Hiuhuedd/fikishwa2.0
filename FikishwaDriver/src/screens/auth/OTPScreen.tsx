import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Colors, Spacing, FontSizes } from '../../theme';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const OTPScreen = () => {
    const route = useRoute<any>();
    const { phone, sessionId } = route.params;
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const login = useAuthStore(state => state.login);

    const handleVerifyParams = async () => {
        try {
            setLoading(true);
            const response = await api.post('/driver/auth/verify-otp', { sessionId, otp });

            if (response.data.success) {
                const { token, userProfile } = response.data.data;
                await login(token, userProfile);
            } else {
                Alert.alert('Error', response.data.message || 'Invalid OTP');
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Verify Phone</Text>
            <Text style={styles.subtitle}>Enter code sent to {phone}</Text>

            <TextInput
                style={styles.input}
                placeholder="000000"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
            />

            <TouchableOpacity
                style={styles.button}
                onPress={handleVerifyParams}
                disabled={loading}
            >
                <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify'}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.lg,
        justifyContent: 'center',
        backgroundColor: Colors.background,
    },
    title: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        marginBottom: Spacing.xxl,
        textAlign: 'center'
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        padding: Spacing.md,
        fontSize: 32,
        letterSpacing: 8,
        marginBottom: Spacing.lg,
    },
    button: {
        backgroundColor: Colors.primary,
        padding: Spacing.md,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: Colors.white,
        fontSize: FontSizes.md,
        fontWeight: 'bold',
    },
});

export default OTPScreen;
