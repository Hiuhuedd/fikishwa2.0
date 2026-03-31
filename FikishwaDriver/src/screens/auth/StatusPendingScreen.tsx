import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const StatusPendingScreen = () => {
    const { user, logout } = useAuthStore();
    const navigation = useNavigation<any>();

    const isRejected = user?.registrationStatus === 'rejected';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={[styles.iconContainer, isRejected && styles.rejectedIconBg]}>
                    {isRejected ? (
                        <AlertCircle size={80} color="#FF3B30" />
                    ) : (
                        <Clock size={80} color="#007AFF" />
                    )}
                </View>

                <Text style={styles.title}>
                    {isRejected ? 'Application Rejected' : 'Application Pending'}
                </Text>

                <Text style={styles.description}>
                    {isRejected
                        ? `Unfortunately, your application was not approved. Reason: ${user?.rejectedReason || 'Please contact support for more details.'}`
                        : 'Thank you for joining Fikishwa! Your documents are currently being reviewed by our team. This usually takes 24-48 hours.'
                    }
                </Text>

                {!isRejected ? (
                    <View style={styles.statusBox}>
                        <View style={styles.statusItem}>
                            <CheckCircle2 size={20} color="#4CD964" />
                            <Text style={styles.statusText}>Documents Submitted</Text>
                        </View>
                        <View style={styles.statusItem}>
                            <Clock size={20} color="#007AFF" />
                            <Text style={[styles.statusText, { color: '#007AFF', fontWeight: '700' }]}>Verification in Progress</Text>
                        </View>
                        <View style={[styles.statusItem, { opacity: 0.5 }]}>
                            <AlertCircle size={20} color="#666" />
                            <Text style={styles.statusText}>Account Activation</Text>
                        </View>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.resubmitBtn}
                        onPress={() => navigation.navigate('DocumentUpload')}
                    >
                        <Text style={styles.resubmitText}>Update Documents</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#F0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    rejectedIconBg: {
        backgroundColor: '#FFF5F5',
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    statusBox: {
        width: '100%',
        backgroundColor: '#F5F5F7',
        borderRadius: 20,
        padding: 24,
        gap: 16,
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusText: {
        fontSize: 15,
        color: '#1A1A1A',
        fontWeight: '500',
    },
    resubmitBtn: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    resubmitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    logoutBtn: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF3B30',
    },
});

export default StatusPendingScreen;
