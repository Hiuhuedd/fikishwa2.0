/**
 * Login Screen
 * Admin phone number input and OTP request
 */

import React, { useState } from 'react';
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
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme';
import { sendOtp } from '../../services/authService';

type AuthStackParamList = {
    Login: undefined;
    Otp: { sessionId: string; phone: string };
};

type LoginScreenProps = {
    navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const formatPhoneNumber = (text: string): string => {
        // Remove non-numeric characters except +
        const cleaned = text.replace(/[^\d+]/g, '');
        return cleaned;
    };

    const handlePhoneChange = (text: string) => {
        setPhone(formatPhoneNumber(text));
    };

    const getFullPhoneNumber = (): string => {
        // Ensure phone has country code
        if (phone.startsWith('+')) {
            return phone;
        }
        if (phone.startsWith('0')) {
            return '+254' + phone.substring(1);
        }
        if (phone.startsWith('254')) {
            return '+' + phone;
        }
        return '+254' + phone;
    };

    const handleSendOtp = async () => {
        if (phone.length < 9) {
            Alert.alert('Invalid Phone', 'Please enter a valid phone number');
            return;
        }

        setLoading(true);
        try {
            const fullPhone = getFullPhoneNumber();
            const response = await sendOtp(fullPhone);

            if (response.success && response.data?.sessionId) {
                navigation.navigate('Otp', {
                    sessionId: response.data.sessionId,
                    phone: fullPhone,
                });
            } else {
                Alert.alert('Error', response.message || 'Failed to send OTP');
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to send OTP. Please try again.';
            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.content}>
                    {/* Logo */}
                    <View style={styles.logoSection}>
                        <View style={styles.logoContainer}>
                            <Text style={styles.logoText}>F</Text>
                        </View>
                        <Text style={styles.title}>Fikishwa Admin</Text>
                        <Text style={styles.subtitle}>Management Console</Text>
                    </View>

                    {/* Login Form */}
                    <View style={styles.formSection}>
                        <Text style={styles.label}>Phone Number</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.countryCode}>+254</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="7XX XXX XXX"
                                placeholderTextColor={Colors.textMuted}
                                keyboardType="phone-pad"
                                value={phone.replace(/^\+?254/, '')}
                                onChangeText={(text) => setPhone(text.replace(/[^\d]/g, ''))}
                                maxLength={10}
                                editable={!loading}
                            />
                        </View>

                        <Text style={styles.infoText}>
                            Only authorized admin phone numbers can access this app.
                        </Text>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleSendOtp}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <Text style={styles.buttonText}>Send OTP</Text>
                            )}
                        </TouchableOpacity>
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
        justifyContent: 'center',
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.xl,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    logoText: {
        fontSize: 40,
        fontWeight: FontWeights.bold,
        color: Colors.white,
    },
    title: {
        fontSize: FontSizes.xxxl,
        fontWeight: FontWeights.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: FontSizes.lg,
        color: Colors.textSecondary,
    },
    formSection: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
    },
    label: {
        fontSize: FontSizes.md,
        fontWeight: FontWeights.medium,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceLight,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
    },
    countryCode: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        fontSize: FontSizes.lg,
        color: Colors.textSecondary,
        backgroundColor: Colors.background,
        borderRightWidth: 1,
        borderRightColor: Colors.border,
    },
    input: {
        flex: 1,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        fontSize: FontSizes.lg,
        color: Colors.textPrimary,
    },
    infoText: {
        fontSize: FontSizes.sm,
        color: Colors.textMuted,
        marginTop: Spacing.md,
        marginBottom: Spacing.lg,
        textAlign: 'center',
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
});

export default LoginScreen;
