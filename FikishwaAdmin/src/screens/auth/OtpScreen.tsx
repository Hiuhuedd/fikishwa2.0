/**
 * OTP Verification Screen
 * 6-digit OTP input and verification
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme';
import { verifyOtp, decodeToken } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

type AuthStackParamList = {
    Login: undefined;
    Otp: { sessionId: string; phone: string };
};

type OtpScreenProps = {
    navigation: NativeStackNavigationProp<AuthStackParamList, 'Otp'>;
    route: RouteProp<AuthStackParamList, 'Otp'>;
};

const OTP_LENGTH = 6;

const OtpScreen: React.FC<OtpScreenProps> = ({ navigation, route }) => {
    const { sessionId, phone } = route.params;
    const { login } = useAuth();

    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);

    const inputRefs = useRef<(TextInput | null)[]>([]);

    // Countdown timer for resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleOtpChange = (value: string, index: number) => {
        if (value.length > 1) {
            // Handle paste
            const pasted = value.slice(0, OTP_LENGTH).split('');
            const newOtp = [...otp];
            pasted.forEach((char, i) => {
                if (index + i < OTP_LENGTH) {
                    newOtp[index + i] = char;
                }
            });
            setOtp(newOtp);
            const nextIndex = Math.min(index + pasted.length, OTP_LENGTH - 1);
            inputRefs.current[nextIndex]?.focus();
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input
        if (value && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const getOtpString = (): string => otp.join('');

    const handleVerifyOtp = async () => {
        const otpString = getOtpString();
        if (otpString.length !== OTP_LENGTH) {
            Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP');
            return;
        }

        setLoading(true);
        try {
            const response = await verifyOtp(sessionId, otpString);

            if (response.success && response.data?.token) {
                const token = response.data.token;

                // Decode token to get user info
                const decodedUser = decodeToken(token);

                if (decodedUser) {
                    await login(token, {
                        uid: decodedUser.uid,
                        phone: decodedUser.phone,
                        role: decodedUser.role,
                    });
                    // Navigation will be handled automatically by AppNavigator
                } else {
                    Alert.alert('Error', 'Failed to process authentication');
                }
            } else {
                Alert.alert('Error', response.message || 'Invalid OTP');
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Verification failed. Please try again.';
            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = () => {
        setCountdown(60);
        navigation.goBack();
    };

    const maskedPhone = phone.replace(/(\+254)(\d{3})(\d+)(\d{3})/, '$1 $2 *** $4');

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.content}>
                    {/* Header */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>

                    {/* Title Section */}
                    <View style={styles.titleSection}>
                        <Text style={styles.title}>Verify OTP</Text>
                        <Text style={styles.subtitle}>
                            Enter the 6-digit code sent to{'\n'}
                            <Text style={styles.phoneText}>{maskedPhone}</Text>
                        </Text>
                    </View>

                    {/* OTP Input */}
                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => (inputRefs.current[index] = ref)}
                                style={[
                                    styles.otpInput,
                                    digit && styles.otpInputFilled,
                                ]}
                                value={digit}
                                onChangeText={(value) => handleOtpChange(value.replace(/[^0-9]/g, ''), index)}
                                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                editable={!loading}
                                selectTextOnFocus
                            />
                        ))}
                    </View>

                    {/* Verify Button */}
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleVerifyOtp}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <Text style={styles.buttonText}>Verify & Login</Text>
                        )}
                    </TouchableOpacity>

                    {/* Resend */}
                    <View style={styles.resendContainer}>
                        {countdown > 0 ? (
                            <Text style={styles.resendText}>
                                Resend OTP in <Text style={styles.countdownText}>{countdown}s</Text>
                            </Text>
                        ) : (
                            <TouchableOpacity onPress={handleResend}>
                                <Text style={styles.resendLink}>Resend OTP</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: Spacing.lg,
    },
    backButton: {
        marginBottom: Spacing.xl,
    },
    backButtonText: {
        fontSize: FontSizes.lg,
        color: Colors.primary,
        fontWeight: FontWeights.medium,
    },
    titleSection: {
        marginBottom: Spacing.xxl,
    },
    title: {
        fontSize: FontSizes.xxxl,
        fontWeight: FontWeights.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: FontSizes.lg,
        color: Colors.textSecondary,
        lineHeight: 26,
    },
    phoneText: {
        color: Colors.primary,
        fontWeight: FontWeights.semibold,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.xl,
    },
    otpInput: {
        width: 48,
        height: 56,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.surface,
        borderWidth: 2,
        borderColor: Colors.border,
        textAlign: 'center',
        fontSize: FontSizes.xxl,
        fontWeight: FontWeights.bold,
        color: Colors.textPrimary,
    },
    otpInputFilled: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '10',
    },
    button: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.semibold,
        color: Colors.white,
    },
    resendContainer: {
        alignItems: 'center',
        marginTop: Spacing.xl,
    },
    resendText: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
    },
    countdownText: {
        color: Colors.primary,
        fontWeight: FontWeights.semibold,
    },
    resendLink: {
        fontSize: FontSizes.md,
        color: Colors.primary,
        fontWeight: FontWeights.semibold,
    },
});

export default OtpScreen;
