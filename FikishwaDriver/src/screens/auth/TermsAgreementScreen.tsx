import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, FileText } from 'lucide-react-native';

const TermsAgreementScreen = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#001C3D" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms of Service</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.iconContainer}>
                    <FileText size={64} color="#001C3D" />
                </View>

                <Text style={styles.lastUpdated}>Last Updated: May 2024</Text>

                <Text style={styles.paragraph}>
                    Please read these Terms of Service ("Terms") carefully before using the Fikishwa Driver app.
                </Text>

                <Text style={styles.sectionTitle}>1. Platform Use</Text>
                <Text style={styles.paragraph}>
                    Fikishwa provides a platform for connecting Riders with Drivers. Using our platform requires a stable internet connection and access to location services.
                </Text>

                <Text style={styles.sectionTitle}>2. Driver Commitment</Text>
                <Text style={styles.paragraph}>
                    As a driver on the Fikishwa platform, you agree to:
                </Text>
                <View style={styles.bulletPoint}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>Maintain all necessary legal documentation (License, Insurance);</Text>
                </View>
                <View style={styles.bulletPoint}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>Provide safe and reliable transportation to riders;</Text>
                </View>
                <View style={styles.bulletPoint}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>Respect all local traffic laws and platform safety guidelines;</Text>
                </View>
                <View style={styles.bulletPoint}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>Uphold a high standard of professional conduct.</Text>
                </View>

                <Text style={styles.sectionTitle}>3. Payments & Fees</Text>
                <Text style={styles.paragraph}>
                    Fikishwa processes payments on your behalf. We reserve the right to modify our service fees with prior notice. Disputes regarding payments must be reported within 48 hours of the transaction.
                </Text>

                <Text style={styles.sectionTitle}>4. Accuracy of Information</Text>
                <Text style={styles.paragraph}>
                    You must ensure that all information provided during registration (Personal details, Vehicle info, License) is accurate and up to date. Providing false information will lead to immediate account suspension.
                </Text>

                <Text style={styles.sectionTitle}>5. Account Security</Text>
                <Text style={styles.paragraph}>
                    You are responsible for maintaining the confidentiality of your account credentials. Fikishwa will not be liable for any unauthorized access resulting from your failure to secure your account.
                </Text>

                <Text style={styles.sectionTitle}>6. Platform Rights</Text>
                <Text style={styles.paragraph}>
                    Fikishwa reserves the right to suspend or deactivate accounts that violate our safety policies, code of conduct, or legal terms. We may update these terms at any time by posting notice within the app.
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

export default TermsAgreementScreen;
