import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Spacing, FontSizes } from '../../theme';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const RegistrationScreen = () => {
    const navigation = useNavigation<any>();
    const { user, login } = useAuthStore();
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');

    // Document URLs (For now, text inputs. In real app, these would be file pickers)
    const [idFrontUrl, setIdFrontUrl] = useState('https://cloudinary.com/placeholder-id-front');
    const [licenseUrl, setLicenseUrl] = useState('https://cloudinary.com/placeholder-license');
    const [goodConductUrl, setGoodConductUrl] = useState('https://cloudinary.com/placeholder-conduct');
    const [carImageUrl, setCarImageUrl] = useState('https://cloudinary.com/placeholder-car');
    const [carRegistrationUrl, setCarRegistrationUrl] = useState('https://cloudinary.com/placeholder-logbook');

    const handleSubmit = async () => {
        if (!name || !email) {
            Alert.alert('Missing Info', 'Please fill in your personal details');
            return;
        }

        try {
            setLoading(true);

            // 1. Prepare Profile Data (The backend submit-registration endpoint handles updates too)
            const profileData = {
                name,
                email,
                idFrontUrl,
                licenseUrl,
                goodConductUrl,
                carImageUrl,
                carRegistrationUrl,
                agreementsAccepted: true
            };

            // 2. Submit Logic
            const response = await api.post('/driver/auth/submit-registration', profileData);

            if (response.data.success) {
                Alert.alert(
                    'Success',
                    'Your application has been submitted for review.',
                    [{
                        text: 'OK', onPress: () => {
                            // Update local user state
                            if (user && user.uid) {
                                // login again/update user to reflect pending_review status
                                // We might need to manually update store or re-fetch profile
                            }
                        }
                    }]
                );
            } else {
                Alert.alert('Submission Failed', response.data.message);
            }

        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to submit application');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                <Text style={styles.title}>Complete Registration</Text>
                <Text style={styles.subtitle}>Submit your documents for verification.</Text>

                {/* Personal Details */}
                <Text style={styles.sectionTitle}>Personal Details</Text>
                <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
                <TextInput style={styles.input} placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" />

                {/* Documents - Mocked as URL inputs for now */}
                <Text style={styles.sectionTitle}>Documents (Mock URLs)</Text>
                <TextInput style={styles.input} placeholder="ID Front URL" value={idFrontUrl} onChangeText={setIdFrontUrl} />
                <TextInput style={styles.input} placeholder="License URL" value={licenseUrl} onChangeText={setLicenseUrl} />
                <TextInput style={styles.input} placeholder="Good Conduct URL" value={goodConductUrl} onChangeText={setGoodConductUrl} />

                {/* Vehicle Details */}
                <Text style={styles.sectionTitle}>Vehicle Photos</Text>
                <TextInput style={styles.input} placeholder="Car Photo URL" value={carImageUrl} onChangeText={setCarImageUrl} />
                <TextInput style={styles.input} placeholder="Logbook URL" value={carRegistrationUrl} onChangeText={setCarRegistrationUrl} />

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>{loading ? 'Submitting...' : 'Submit Application'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    container: {
        flex: 1,
        padding: Spacing.lg,
    },
    title: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.primary,
        marginTop: Spacing.md,
        marginBottom: Spacing.sm,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        padding: Spacing.md,
        fontSize: FontSizes.md,
        marginBottom: Spacing.md,
        backgroundColor: Colors.surface,
    },
    button: {
        backgroundColor: Colors.primary,
        padding: Spacing.md,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: Spacing.xl,
        marginBottom: Spacing.xxl,
    },
    buttonText: {
        color: Colors.white,
        fontSize: FontSizes.md,
        fontWeight: 'bold',
    },
});

export default RegistrationScreen;
