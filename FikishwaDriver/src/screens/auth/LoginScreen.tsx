import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, FontSizes } from '../../theme';
import api from '../../services/api';

const LoginScreen = () => {
    const navigation = useNavigation<any>();
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async () => {
        if (!phone) {
            Alert.alert('Error', 'Please enter your phone number');
            return;
        }

        try {
            setLoading(true);
            const response = await api.post('/driver/auth/send-otp', { phone });

            if (response.data.success) {
                navigation.navigate('OTP', { phone, sessionId: response.data.data.sessionId });
            } else {
                Alert.alert('Error', response.data.message || 'Failed to send OTP');
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Connection failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Fikishwa Driver</Text>
            <Text style={styles.subtitle}>Partner with us</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                    style={styles.input}
                    placeholder="+254..."
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={handleSendOtp}
                disabled={loading}
            >
                <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Continue'}</Text>
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
        fontSize: FontSizes.xxl,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: FontSizes.lg,
        color: Colors.textSecondary,
        marginBottom: Spacing.xxl,
    },
    inputContainer: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        padding: Spacing.md,
        fontSize: FontSizes.md,
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

export default LoginScreen;
