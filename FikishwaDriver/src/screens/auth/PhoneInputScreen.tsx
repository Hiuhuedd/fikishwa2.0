import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import driverApiService from '../../services/driverApiService';
import { Car, Smartphone, ArrowRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'PhoneInput'>;

const PhoneInputScreen = () => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const { setPhoneNumber, setSessionId } = useAuthStore();
    const navigation = useNavigation<NavigationProp>();

    const handleSendOtp = async () => {
        if (!phone || phone.length < 9) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return;
        }

        setLoading(true);
        try {
            const response = await driverApiService.sendOtp(phone);
            if (response.data.success) {
                setPhoneNumber(phone);
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

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Car size={48} color="#007AFF" />
                    </View>
                    <Text style={styles.title}>Fikishwa Driver</Text>
                    <Text style={styles.subtitle}>Enter your phone number to sign in or register</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Smartphone size={20} color="#666" style={styles.inputIcon} />
                        <Text style={styles.countryCode}>+254</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="712345678"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            placeholderTextColor="#999"
                            maxLength={10}
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
        backgroundColor: '#F0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
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
    footer: {
        marginTop: 32,
        alignItems: 'center',
    },
    footerText: {
        color: '#666',
        fontSize: 14,
    },
    link: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
});

export default PhoneInputScreen;
