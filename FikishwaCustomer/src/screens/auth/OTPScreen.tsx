import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    StatusBar, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import customerApiService from '../../services/customerApiService';
import { ChevronLeft, Pencil, Clock } from 'lucide-react-native';

const OTP_LENGTH = 4;

const OTPScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { phone, sessionId: initialSessionId, registrationData } = route.params;
    const [sessionId, setSessionId] = useState(initialSessionId);
    const { colors, fontSizes, spacing } = useTheme();
    const { login } = useAuthStore();

    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
    const [focusedIndex, setFocusedIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const inputRefs = useRef<TextInput[]>([]);

    useEffect(() => {
        if (countdown > 0) {
            const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [countdown]);

    const maskIdentifier = (id: string) => {
        if (!id) return '';
        if (id.includes('@')) {
            const [local, domain] = id.split('@');
            return `${local.slice(0, 2)}***@${domain}`;
        }
        const parts = id.split(' ');
        let main = parts.length > 1 ? parts[1] : id.replace('+254', '');
        if (main.startsWith('254')) main = main.slice(3);
        return `+254 *****${main.slice(-4)}`;
    };

    const handleChange = (text: string, index: number) => {
        if (text.length > 1) {
            text = text.charAt(text.length - 1);
        }

        // Only allow numbers
        if (text && !/^\d+$/.test(text)) return;

        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        if (text && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const verifyOtp = async () => {
        const code = otp.join('');
        if (code.length < OTP_LENGTH) return;

        setLoading(true);
        try {
            const response = await customerApiService.verifyOtp({ sessionId, otp: code });
            if (response.data.success) {
                const { token, userProfile } = response.data.data;

                if (registrationData) {
                    await AsyncStorage.setItem('customerToken', token);
                    try {
                        const name = `${registrationData.firstName} ${registrationData.lastName}`.trim();
                        await customerApiService.updateProfile({
                            name,
                            email: registrationData.email
                        });
                    } catch (e) {
                        console.log('[OTP] Failed to update profile after registration:', e);
                    }
                    navigation.replace('Success', { token, userProfile });
                } else {
                    const isProfileComplete = !!(userProfile.name && userProfile.email);
                    if (isProfileComplete) {
                        await login(token, userProfile);
                        navigation.replace('Home');
                    } else {
                        navigation.replace('Register', {
                            mode: 'complete',
                            token,
                            userProfile
                        });
                    }
                }
            } else {
                Alert.alert('Invalid Code', 'The code you entered is incorrect.');
                setOtp(Array(OTP_LENGTH).fill(''));
                setFocusedIndex(0);
                inputRefs.current[0]?.focus();
            }
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Verification failed.');
            setOtp(Array(OTP_LENGTH).fill(''));
            setFocusedIndex(0);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;
        try {
            const response = await customerApiService.sendOtp(phone);
            setSessionId(response.data.data.sessionId);
            setCountdown(60);
            Alert.alert('Sent', 'A new code has been sent.');
        } catch {
            Alert.alert('Error', 'Failed to resend code.');
        }
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft size={28} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>OTP Verification</Text>

                    <View style={styles.phoneRow}>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Enter the OTP code that we sent to you on
                        </Text>
                        <View style={styles.maskContainer}>
                            <Text style={[styles.maskedPhone, { color: colors.textPrimary }]}>
                                {maskIdentifier(phone)}
                            </Text>
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <Pencil size={18} color={colors.info} />
                            </TouchableOpacity>

                            <View style={styles.timerWrap}>
                                <Clock size={16} color={colors.info} />
                                <Text style={[styles.timerText, { color: colors.info }]}>
                                    {countdown < 10 ? `0${countdown}` : countdown}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* OTP Boxes */}
                    <View style={styles.otpRow}>
                        {otp.map((digit, i) => {
                            const isFocused = focusedIndex === i;
                            return (
                                <View
                                    key={i}
                                    style={[
                                        styles.otpInputWrapper,
                                        {
                                            borderColor: isFocused ? colors.primary : colors.border,
                                            backgroundColor: isFocused ? colors.background : colors.backgroundCard,
                                            shadowOpacity: isFocused ? 0.15 : 0.05,
                                            elevation: isFocused ? 4 : 2,
                                        },
                                        digit !== '' && !isFocused && { backgroundColor: colors.primary + '08' }
                                    ]}
                                >
                                    <TextInput
                                        ref={(ref) => { if (ref) inputRefs.current[i] = ref; }}
                                        style={[styles.otpBox, { color: colors.textPrimary }]}
                                        maxLength={1}
                                        keyboardType="number-pad"
                                        autoFocus={i === 0}
                                        value={digit}
                                        onChangeText={(t) => handleChange(t, i)}
                                        onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                                        onFocus={() => setFocusedIndex(i)}
                                        textAlign="center"
                                        selectTextOnFocus
                                    />
                                </View>
                            );
                        })}
                    </View>

                    <TouchableOpacity
                        onPress={handleResend}
                        disabled={countdown > 0}
                        style={styles.resendBtn}
                    >
                        <Text style={[styles.resendText, { color: countdown > 0 ? colors.textTertiary : colors.primary }]}>
                            Didn't receive code? Resend
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.footer, { paddingHorizontal: spacing.screenPadding }]}>
                    <TouchableOpacity
                        style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: otp.join('').length < OTP_LENGTH || loading ? 0.6 : 1 }]}
                        onPress={verifyOtp}
                        disabled={otp.join('').length < OTP_LENGTH || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={[styles.primaryBtnText, { color: colors.textOnPrimary }]}>Verify</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        paddingHorizontal: 10,
        paddingTop: 10,
    },
    backBtn: {
        padding: 10,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 16,
    },
    phoneRow: {
        marginBottom: 40,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 8,
        opacity: 0.8,
    },
    maskContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    maskedPhone: {
        fontSize: 18,
        fontWeight: '700',
    },
    timerWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginLeft: 'auto',
    },
    timerText: {
        fontSize: 16,
        fontWeight: '600',
    },
    otpRow: {
        flexDirection: 'row',
        gap: 16,
        justifyContent: 'center',
        marginVertical: 20,
    },
    otpInputWrapper: {
        width: 65,
        height: 75,
        borderRadius: 18,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
    },
    otpBox: {
        width: '100%',
        height: '100%',
        fontSize: 32,
        fontWeight: '800',
    },
    resendBtn: {
        marginTop: 32,
        alignSelf: 'center',
    },
    resendText: {
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        paddingBottom: 30,
        paddingTop: 10,
    },
    primaryBtn: {
        borderRadius: 999,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtnText: {
        fontSize: 20,
        fontWeight: '800',
    },
});

export default OTPScreen;
