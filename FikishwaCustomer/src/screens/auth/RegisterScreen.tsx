import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    StatusBar, TextInput, ScrollView, KeyboardAvoidingView, Platform,
    Alert, ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { ChevronLeft, Check } from 'lucide-react-native';
import customerApiService from '../../services/customerApiService';

const RegisterScreen = () => {
    const navigation = useNavigation<any>();
    const { colors, spacing, fontSizes } = useTheme();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!firstName || !lastName || !email || !phone) {
            Alert.alert('Missing Info', 'Please fill in all required fields.');
            return;
        }
        if (!agreed) {
            Alert.alert('Agreement Required', 'Please agree to the Terms & Conditions.');
            return;
        }

        setLoading(true);
        try {
            // Format phone to +254...
            const cleaned = phone.replace(/\s/g, '');
            const formattedPhone = cleaned.startsWith('0')
                ? '254' + cleaned.slice(1)
                : cleaned.startsWith('254')
                    ? cleaned
                    : cleaned.startsWith('+254') ? cleaned.slice(1) : '254' + cleaned;

            const payload = {
                firstName,
                lastName,
                email,
                phone: formattedPhone,
                referralCode,
            };

            const response = await customerApiService.sendOtp(formattedPhone);
            const sessionId = response.data.data.sessionId;

            // Pass registration data along to OTP screen to be saved after verification
            navigation.navigate('OTP', {
                phone: formattedPhone,
                sessionId,
                registrationData: payload
            });
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to start registration.');
        } finally {
            setLoading(false);
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

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>Create Account</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enter your basic details</Text>

                    <View style={styles.form}>
                        {/* Name Row */}
                        <View style={styles.row}>
                            <View style={styles.inputWrap}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>First Name *</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.backgroundCard, color: colors.textPrimary }]}
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    placeholder="Edward"
                                    placeholderTextColor={colors.textTertiary}
                                />
                            </View>
                            <View style={styles.inputWrap}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>Last Name *</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.backgroundCard, color: colors.textPrimary }]}
                                    value={lastName}
                                    onChangeText={setLastName}
                                    placeholder="Hiuhu"
                                    placeholderTextColor={colors.textTertiary}
                                />
                            </View>
                        </View>

                        {/* Email */}
                        <View style={styles.fullWidthInput}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Email *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.backgroundCard, color: colors.textPrimary }]}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Edwardhiuhu0@gmail.com"
                                placeholderTextColor={colors.textTertiary}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Mobile */}
                        <View style={styles.fullWidthInput}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Mobile Number *</Text>
                            <View style={[styles.phoneInputContainer, { backgroundColor: colors.backgroundCard }]}>
                                <View style={styles.countryPicker}>
                                    <Text style={{ fontSize: 20 }}>🇰🇪</Text>
                                    <Text style={[styles.countryCode, { color: colors.textPrimary }]}>+254</Text>
                                </View>
                                <TextInput
                                    style={[styles.phoneInput, { color: colors.textPrimary }]}
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="743466032"
                                    placeholderTextColor={colors.textTertiary}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        {/* Referral */}
                        <View style={[styles.fullWidthInput, { marginTop: 10 }]}>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.backgroundCard, color: colors.textPrimary }]}
                                value={referralCode}
                                onChangeText={setReferralCode}
                                placeholder="Referral Code (Optional)"
                                placeholderTextColor={colors.textTertiary}
                            />
                        </View>

                        {/* Terms */}
                        <View style={styles.termsContainer}>
                            <TouchableOpacity
                                style={[styles.checkbox, { backgroundColor: agreed ? colors.success : 'transparent', borderColor: agreed ? colors.success : colors.border }]}
                                onPress={() => setAgreed(!agreed)}
                            >
                                {agreed && <Check size={14} color="#fff" />}
                            </TouchableOpacity>
                            <Text style={[styles.termsText, { color: colors.textSecondary }]}>
                                By continuing, I confirm that i have read & agree to the{' '}
                                <Text style={{ color: colors.info }}>Terms & Conditions</Text> and{' '}
                                <Text style={{ color: colors.info }}>Privacy Policies</Text>
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                <View style={[styles.footer, { paddingHorizontal: spacing.screenPadding }]}>
                    <TouchableOpacity
                        style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading || !agreed ? 0.7 : 1 }]}
                        onPress={handleRegister}
                        disabled={loading || !agreed}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={[styles.primaryBtnText, { color: colors.textOnPrimary }]}>Register</Text>
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
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 32,
        opacity: 0.8,
    },
    form: {
        gap: 20,
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    inputWrap: {
        flex: 1,
    },
    fullWidthInput: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        fontWeight: '500',
    },
    phoneInputContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    countryPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRightWidth: 1,
        borderRightColor: '#E2E8F0',
        paddingRight: 12,
        marginVertical: 14,
    },
    countryCode: {
        fontSize: 16,
        fontWeight: '600',
    },
    phoneInput: {
        flex: 1,
        paddingHorizontal: 12,
        fontSize: 16,
        fontWeight: '600',
        paddingVertical: 14,
    },
    termsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
        paddingRight: 20,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    termsText: {
        fontSize: 13,
        lineHeight: 18,
    },
    footer: {
        paddingBottom: 70,
        paddingTop: 0,
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

export default RegisterScreen;
