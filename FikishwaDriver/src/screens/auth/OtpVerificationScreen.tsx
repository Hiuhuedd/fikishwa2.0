import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import driverApiService from '../../services/driverApiService';
import { ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OtpVerification'>;

const OtpVerificationScreen = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(30);
    const { phoneNumber, sessionId, setAuth, setSessionId } = useAuthStore();
    const navigation = useNavigation<NavigationProp>();
    const inputRefs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value !== '' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const fullOtp = otp.join('');
        if (fullOtp.length < 6) {
            Alert.alert('Error', 'Please enter the complete 6-digit OTP');
            return;
        }

        setLoading(true);
        try {
            const response = await driverApiService.verifyOtp({
                sessionId,
                otp: fullOtp
            });

            if (response.data.success) {
                const { token, userProfile } = response.data.data;
                await setAuth(userProfile, token);
                // Navigation will be handled by RootNavigator based on auth state
            } else {
                Alert.alert('Error', response.data.message || 'Invalid OTP');
            }
        } catch (error: any) {
            console.error('Verify OTP error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (timer > 0) return;

        setLoading(true);
        try {
            const response = await driverApiService.sendOtp(phoneNumber || '');
            if (response.data.success) {
                setSessionId(response.data.data.sessionId);
                setTimer(30);
                setOtp(['', '', '', '', '', '']);
                Alert.alert('Success', 'A new OTP has been sent to your phone');
            }
        } catch (error: any) {
            Alert.alert('Error', 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <ShieldCheck size={48} color="#007AFF" />
                    </View>
                    <Text style={styles.title}>Verification</Text>
                    <Text style={styles.subtitle}>Enter the 6-digit code sent to</Text>
                    <Text style={styles.phoneNumber}>+254 {phoneNumber}</Text>
                </View>

                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => { inputRefs.current[index] = ref; }}
                            style={styles.otpInput}
                            value={digit}
                            onChangeText={(value) => handleOtpChange(value, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            selectTextOnFocus
                        />
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleVerifyOtp}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.buttonText}>Verify & Continue</Text>
                            <ArrowRight size={20} color="#fff" style={{ marginLeft: 8 }} />
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Didn't receive code? </Text>
                    <TouchableOpacity onPress={handleResendOtp} disabled={timer > 0}>
                        <View style={styles.resendButton}>
                            {timer > 0 ? (
                                <Text style={styles.timerText}>Resend in {timer}s</Text>
                            ) : (
                                <>
                                    <RefreshCw size={14} color="#007AFF" style={{ marginRight: 4 }} />
                                    <Text style={styles.resendLink}>Resend OTP</Text>
                                </>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#F0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    phoneNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        marginTop: 4,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    otpInput: {
        width: (Dimensions.get('window').width - 48 - 50) / 6,
        height: 56,
        backgroundColor: '#F5F5F7',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E1E1E5',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    button: {
        height: 56,
        backgroundColor: '#007AFF',
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    resendContainer: {
        marginTop: 32,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resendText: {
        color: '#666',
        fontSize: 14,
    },
    resendButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resendLink: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
    timerText: {
        color: '#999',
        fontSize: 14,
        fontWeight: '500',
    },
});

import { Dimensions } from 'react-native';

export default OtpVerificationScreen;
