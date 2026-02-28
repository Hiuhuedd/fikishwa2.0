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
        if (otp.length !== 6) {
            Alert.alert('Error', 'Please enter a 6-digit OTP');
            return;
        }

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

    const renderOtpBoxes = () => {
        const boxes = [];
        for (let i = 0; i < 6; i++) {
            const digit = otp[i] || '';
            const isFocused = otp.length === i;
            boxes.push(
                <View
                    key={i}
                    style={[
                        styles.otpBox,
                        isFocused && styles.otpBoxFocused,
                        digit !== '' && styles.otpBoxFilled
                    ]}
                >
                    <Text style={styles.otpText}>{digit}</Text>
                </View>
            );
        }
        return boxes;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Verify Phone</Text>
            <Text style={styles.subtitle}>Enter 6-digit code sent to {phone}</Text>

            <View style={styles.otpContainer}>
                {renderOtpBoxes()}
            </View>

            <TextInput
                style={styles.hiddenInput}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus={true}
            />

            <TouchableOpacity
                style={[styles.button, (loading || otp.length !== 6) && styles.buttonDisabled]}
                onPress={handleVerifyParams}
                disabled={loading || otp.length !== 6}
            >
                <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.resendButton}
                onPress={() => Alert.alert('Resend', 'Feature coming soon')}
                disabled={loading}
            >
                <Text style={styles.resendText}>Didn't receive code? Resend</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.xl,
        justifyContent: 'center',
        backgroundColor: Colors.background,
    },
    title: {
        fontSize: FontSizes.xxxl,
        fontWeight: 'bold',
        color: Colors.white,
        marginBottom: Spacing.xs,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        marginBottom: 40,
        textAlign: 'center'
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    otpBox: {
        width: 45,
        height: 55,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        backgroundColor: Colors.backgroundLighter,
        justifyContent: 'center',
        alignItems: 'center',
    },
    otpBoxFocused: {
        borderColor: Colors.primary,
        borderWidth: 2,
    },
    otpBoxFilled: {
        borderColor: Colors.primaryLight,
    },
    otpText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.white,
    },
    hiddenInput: {
        position: 'absolute',
        opacity: 0,
        width: 1,
        height: 1,
    },
    button: {
        backgroundColor: Colors.primary,
        padding: Spacing.md,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: Spacing.lg,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: Colors.white,
        fontSize: FontSizes.md,
        fontWeight: 'bold',
    },
    resendButton: {
        marginTop: 30,
        alignItems: 'center',
    },
    resendText: {
        color: Colors.textSecondary,
        fontSize: FontSizes.sm,
    },
});

export default OTPScreen;
