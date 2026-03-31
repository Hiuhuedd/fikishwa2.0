import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    StatusBar, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import api from '../../services/api';
import customerApiService from '../../services/customerApiService';
import { API_ENDPOINTS } from '../../config/api';
import { Phone, ChevronLeft } from 'lucide-react-native';

const PhoneLoginScreen = () => {
    const navigation = useNavigation<any>();
    const { colors, spacing, fontSizes } = useTheme();
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async () => {
        const cleaned = phone.replace(/\s/g, '');
        if (cleaned.length < 9) {
            Alert.alert('Invalid Number', 'Please enter a valid Kenyan phone number.');
            return;
        }
        setLoading(true);
        try {
            const formatted = cleaned.startsWith('0')
                ? '254' + cleaned.slice(1)
                : cleaned.startsWith('+254')
                    ? cleaned.slice(1)
                    : cleaned.startsWith('254')
                        ? cleaned
                        : '254' + cleaned;

            const response = await customerApiService.sendOtp(formatted);
            const sessionId = response.data.data.sessionId;
            navigation.navigate('OTP', { phone: formatted, sessionId });
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                {/* Header */}
                <View style={[styles.header, { paddingHorizontal: spacing.screenPadding }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
                        <ChevronLeft size={22} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                <View style={[styles.content, { paddingHorizontal: spacing.screenPadding }]}>
                    {/* Icon */}
                    <View style={[styles.iconWrap, { backgroundColor: colors.primary + '15' }]}>
                        <Phone size={28} color={colors.primary} />
                    </View>

                    <Text style={[styles.title, { color: colors.textPrimary }]}>What's your number?</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: fontSizes.md }]}>
                        We'll send a one-time code to verify your account.
                    </Text>

                    {/* Phone Input */}
                    <View style={[styles.inputContainer, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
                        <Text style={[styles.dialCode, { color: colors.textSecondary, fontSize: fontSizes.lg }]}>🇰🇪 +254</Text>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <TextInput
                            style={[styles.input, { color: colors.textPrimary, fontSize: fontSizes.xl }]}
                            placeholder="7XX XXX XXX"
                            placeholderTextColor={colors.textTertiary}
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={setPhone}
                            maxLength={12}
                            autoFocus
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.btn, { backgroundColor: colors.primary, opacity: phone.length < 9 || loading ? 0.5 : 1 }]}
                        onPress={handleSendOTP}
                        disabled={phone.length < 9 || loading}
                        activeOpacity={0.85}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={[styles.btnText, { fontSize: fontSizes.lg }]}>Send Code</Text>
                        }
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: { paddingTop: 16, paddingBottom: 8 },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1,
    },
    content: { flex: 1, paddingTop: 32 },
    iconWrap: {
        width: 64, height: 64, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    },
    title: { fontSize: 28, fontWeight: '800', marginBottom: 10, letterSpacing: -0.5 },
    subtitle: { marginBottom: 36, lineHeight: 22 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 16, borderWidth: 1.5,
        paddingHorizontal: 16, paddingVertical: 4,
        marginBottom: 24,
    },
    dialCode: { fontWeight: '700', marginRight: 12 },
    divider: { width: 1, height: 24, marginRight: 12 },
    input: { flex: 1, fontWeight: '700', letterSpacing: 1, paddingVertical: 14 },
    btn: { borderRadius: 16, paddingVertical: 17, alignItems: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
    btnText: { color: '#fff', fontWeight: '700', letterSpacing: 0.3 },
});

export default PhoneLoginScreen;
