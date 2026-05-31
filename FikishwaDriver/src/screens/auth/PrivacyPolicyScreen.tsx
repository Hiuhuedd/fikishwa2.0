import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';

const PrivacyPolicyScreen = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#001C3D" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.iconContainer}>
                    <ShieldCheck size={64} color="#001C3D" />
                </View>

                <Text style={styles.lastUpdated}>Last Updated: May 2024</Text>

                <Text style={styles.sectionTitle}>1. Introduction</Text>
                <Text style={styles.paragraph}>
                    Fikishwa ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share information about you when you use the Fikishwa Platform (including Driver and Customer apps).
                </Text>

                <Text style={styles.sectionTitle}>2. Information We Collect</Text>
                <Text style={styles.subSectionTitle}>2.1 Personal Information</Text>
                <Text style={styles.paragraph}>
                    We collect information you provide directly to us, such as your name, email, phone number, and profile picture. For Drivers, we also collect license information, vehicle documentation, and identification details.
                </Text>

                <Text style={styles.subSectionTitle}>2.2 Location Information</Text>
                <Text style={styles.paragraph}>
                    To provide ride-hailing services, we must collect precise location data from your device. For Drivers, this data is collected even when the app is in the background to ensure accurate trip tracking and matching.
                </Text>

                <Text style={styles.subSectionTitle}>2.3 Camera and Photo Access</Text>
                <Text style={styles.paragraph}>
                    The app requires access to your camera and gallery specifically for uploading profile images and, in the case of Drivers, for identity and vehicle verification documents. We do not use these permissions for any other purpose.
                </Text>

                <Text style={styles.sectionTitle}>3. How We Use Information</Text>
                <View style={styles.bulletPoint}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>To facilitate the connection between Riders and Drivers;</Text>
                </View>
                <View style={styles.bulletPoint}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>To process payments and generate receipts;</Text>
                </View>
                <View style={styles.bulletPoint}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>To ensure the safety and security of our Platform;</Text>
                </View>
                <View style={styles.bulletPoint}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>To provide customer support and updates.</Text>
                </View>

                <Text style={styles.sectionTitle}>4. Data Sharing</Text>
                <Text style={styles.paragraph}>
                    We share names and locations between users to facilitate rides. We do not sell your personal data to third parties. We may disclose information if required by law or to protect our legal rights.
                </Text>

                <Text style={styles.sectionTitle}>5. Your Rights & Choices</Text>
                <Text style={styles.paragraph}>
                    You can manage your profile data and location settings within the app and your device settings. You may request account deletion at any time via the app or by contacting support.
                </Text>

                <Text style={styles.sectionTitle}>6. Contact Us</Text>
                <Text style={styles.paragraph}>
                    Questions? Reach us at: support@fikishwa.com
                </Text>

                <View style={styles.footerSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#001C3D',
    },
    scrollContent: {
        padding: 24,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    lastUpdated: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#001C3D',
        marginTop: 24,
        marginBottom: 12,
    },
    subSectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
        marginTop: 16,
        marginBottom: 8,
    },
    paragraph: {
        fontSize: 16,
        lineHeight: 24,
        color: '#475569',
        marginBottom: 16,
    },
    bulletPoint: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingLeft: 8,
    },
    bullet: {
        fontSize: 16,
        color: '#001C3D',
        marginRight: 8,
        fontWeight: 'bold',
    },
    bulletText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        color: '#475569',
    },
    footerSpacer: {
        height: 48,
    },
});

export default PrivacyPolicyScreen;
