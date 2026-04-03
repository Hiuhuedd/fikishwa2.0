import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import driverApiService from '../../services/driverApiService';
import { Car, Smartphone, ArrowRight, Mail } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'PhoneInput'>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PhoneInputScreen = () => {
    const { lastIdentifier, setPhoneNumber, setSessionId } = useAuthStore();

    // Auto-detect mode from lastIdentifier or default to email
    const [loginMode, setLoginMode] = useState<'phone' | 'email'>(lastIdentifier?.includes('@') || !lastIdentifier ? 'email' : 'phone');
    const [identifier, setIdentifier] = useState(lastIdentifier || '');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation<NavigationProp>();

    // Update internal state when store initializes
    useEffect(() => {
        if (lastIdentifier && !identifier) {
            setIdentifier(lastIdentifier);
            setLoginMode(lastIdentifier.includes('@') ? 'email' : 'phone');
        }
    }, [lastIdentifier]);

    const handleSendOtp = async () => {
        const cleaned = identifier.trim();
        if (!cleaned) {
            Alert.alert('Error', `Please enter your ${loginMode === 'email' ? 'email' : 'phone number'}`);
            return;
        }

        // Basic validation
        if (loginMode === 'phone' && cleaned.length < 9) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return;
        }
        if (loginMode === 'email' && !emailRegex.test(cleaned)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            let formatted = cleaned;
            if (loginMode === 'phone') {
                // Normalize phone for Kenyan context
                formatted = cleaned.startsWith('0')
                    ? '254' + cleaned.slice(1)
                    : cleaned.startsWith('+254')
                        ? cleaned.slice(1)
                        : cleaned.startsWith('254')
                            ? cleaned
                            : '254' + cleaned;
            }

            const response = await driverApiService.sendOtp(formatted);
            if (response.data.success) {
                setPhoneNumber(formatted);
                setSessionId(response.data.data.sessionId);
                navigation.navigate('OtpVerification');
            } else {
                Alert.alert('Error', response.data.message || 'Failed to send OTP');
            }
        } catch (error: any) {
            console.error('Send OTP error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setLoginMode(loginMode === 'email' ? 'phone' : 'email');
        setIdentifier(''); // Clear when switching to avoid confusion
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Car size={48} color="#001C3D" />
                    </View>
                    <Text style={styles.title}>Fikishwa Driver</Text>
                    <Text style={styles.subtitle}>
                        {loginMode === 'email' ? 'Enter your email' : 'Enter your mobile'} to sign in or register
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        {loginMode === 'email' ? (
                            <Mail size={20} color="#666" style={styles.inputIcon} />
                        ) : (
                            <Smartphone size={20} color="#666" style={styles.inputIcon} />
                        )}

                        {loginMode === 'phone' && <Text style={styles.countryCode}>+254</Text>}

                        <TextInput
                            style={styles.input}
                            placeholder={loginMode === 'email' ? "Enter Email" : "7XXXXXXXX"}
                            value={identifier}
                            onChangeText={setIdentifier}
                            keyboardType={loginMode === 'email' ? "email-address" : "phone-pad"}
                            placeholderTextColor="#999"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoFocus
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleSendOtp}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>Send OTP</Text>
                                <ArrowRight size={20} color="#fff" style={{ marginLeft: 8 }} />
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.modeToggle}
                        onPress={toggleMode}
                        disabled={loading}
                    >
                        <Text style={styles.modeToggleText}>
                            {loginMode === 'email' ? 'Proceed with Phone' : 'Proceed with Email'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>By proceeding, you agree to our </Text>
                    <TouchableOpacity>
                        <Text style={styles.link}>Terms & Conditions</Text>
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
        backgroundColor: '#E6F0FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#001C3D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
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
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
        borderRadius: 12,
        marginBottom: 24,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: '#E1E1E5',
    },
    inputIcon: {
        marginRight: 12,
    },
    countryCode: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1A1A1A',
        fontWeight: '500',
    },
    button: {
        height: 56,
        backgroundColor: '#001C3D',
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#001C3D',
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
    footer: {
        marginTop: 32,
        alignItems: 'center',
    },
    footerText: {
        color: '#666',
        fontSize: 14,
    },
    link: {
        color: '#001C3D',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    modeToggle: {
        marginTop: 16,
        alignItems: 'center',
        paddingVertical: 12,
    },
    modeToggleText: {
        color: '#001C3D',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default PhoneInputScreen;
