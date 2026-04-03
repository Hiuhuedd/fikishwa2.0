import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import driverApiService from '../../services/driverApiService';
import { User, Mail, MapPin, Phone, ArrowRight, ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'PersonalDetails'>;

const PersonalDetailsScreen = () => {
    const { user, setAuth, logout } = useAuthStore();
    const navigation = useNavigation<NavigationProp>();

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [address, setAddress] = useState(user?.address || '');
    const [loading, setLoading] = useState(false);

    const handleNext = async () => {
        if (!name || !email || !phone || !address) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        // Basic phone validation
        if (phone.length < 9) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return;
        }

        setLoading(true);
        try {
            const response = await driverApiService.updateProfile({
                name,
                email,
                phone,
                address
            });
            if (response.data.success) {
                // Update local store with new profile data
                // Note: assuming token remains same, we keep it
                const currentToken = useAuthStore.getState().token;
                await setAuth(response.data.data, currentToken!);
                navigation.navigate('IdentityDocuments');
            }
        } catch (error: any) {
            console.error('Update profile error:', error);
            Alert.alert('Error', 'Failed to update profile');
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
                    <View style={styles.titleRow}>
                        <TouchableOpacity
                            onPress={() => Alert.alert('Sign Out', 'Do you want to sign out and change your phone number?', [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Sign Out', onPress: logout, style: 'destructive' }
                            ])}
                            style={styles.backButton}
                        >
                            <ChevronLeft size={28} color="#1A1A1A" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Personal Profile</Text>
                        <Text style={styles.stepIndicator}>1/4</Text>
                    </View>
                    <Text style={styles.subtitle}>Let's start with your basic information</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputContainer}>
                            <User size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your full name"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputContainer}>
                            <Mail size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <View style={styles.inputContainer}>
                            <Phone size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 0712345678"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>City/Address</Text>
                        <View style={styles.inputContainer}>
                            <MapPin size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your city or address"
                                value={address}
                                onChangeText={setAddress}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleNext}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>Next Step</Text>
                                <ArrowRight size={20} color="#fff" style={{ marginLeft: 8 }} />
                            </>
                        )}
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
    },
    header: {
        marginTop: 24,
        marginBottom: 24,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    backButton: {
        marginLeft: -12,
        marginRight: 4,
        padding: 4,
    },
    title: {
        flex: 1,
        fontSize: 28,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    stepIndicator: {
        fontSize: 18,
        fontWeight: '600',
        color: '#64748B',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: '#E1E1E5',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1A1A1A',
    },
    button: {
        height: 56,
        backgroundColor: '#001C3D',
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default PersonalDetailsScreen;
