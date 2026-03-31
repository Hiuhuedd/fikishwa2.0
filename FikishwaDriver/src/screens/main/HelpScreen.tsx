import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { ChevronLeft, Info, Phone, MessageSquare, FileText, ExternalLink } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const HelpScreen = () => {
    const navigation = useNavigation();

    const HelpItem = ({ icon: Icon, title, description, onPress }: any) => (
        <TouchableOpacity style={styles.helpItem} onPress={onPress}>
            <View style={styles.helpItemLeft}>
                <View style={styles.iconContainer}>
                    <Icon size={22} color="#4A1D24" />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.helpTitle}>{title}</Text>
                    <Text style={styles.helpDescription}>{description}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={28} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.heroSection}>
                    <Text style={styles.heroTitle}>How can we help you today?</Text>
                    <Text style={styles.heroSubtitle}>Find answers to common questions or contact our support team.</Text>
                </View>

                <View style={styles.section}>
                    <HelpItem
                        icon={Info}
                        title="FAQ"
                        description="View answers to most common questions"
                    />
                    <HelpItem
                        icon={Phone}
                        title="Call Support"
                        description="Talk directly with our support team"
                    />
                    <HelpItem
                        icon={MessageSquare}
                        title="Live Chat"
                        description="Chat with us in real-time"
                    />
                    <HelpItem
                        icon={FileText}
                        title="Safety Center"
                        description="Learn about our safety features and tips"
                    />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.versionText}>Fikishwa Driver v2.0.1</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backButton: { padding: 4, marginRight: 16 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
    scrollContent: { padding: 24 },
    heroSection: { marginBottom: 32 },
    heroTitle: { fontSize: 28, fontWeight: '800', color: '#1E293B', lineHeight: 36 },
    heroSubtitle: { fontSize: 16, color: '#64748B', marginTop: 12, lineHeight: 24 },
    section: { gap: 16 },
    helpItem: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 20 },
    helpItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 20 },
    iconContainer: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' },
    textContainer: { flex: 1 },
    helpTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    helpDescription: { fontSize: 14, color: '#64748B', marginTop: 4 },
    footer: { marginTop: 40, alignItems: 'center' },
    versionText: { fontSize: 12, color: '#CBD5E1' }
});

export default HelpScreen;
