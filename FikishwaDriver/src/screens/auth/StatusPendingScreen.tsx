import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, RefreshControl, Alert } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import driverApiService from '../../services/driverApiService';

const StatusPendingScreen = () => {
    const { user, setAuth, logout } = useAuthStore();
    const navigation = useNavigation<any>();
    const [refreshing, setRefreshing] = useState(false);

    const isRejected = user?.registrationStatus === 'rejected';

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const response = await driverApiService.getProfile();
            if (response.data.success) {
                const refreshedUser = response.data.data;
                const currentToken = useAuthStore.getState().token;
                await setAuth(refreshedUser, currentToken!);

                if (refreshedUser.registrationStatus === 'approved') {
                    Alert.alert('Approved!', 'Your account has been approved. Welcome to Fikishwa!');
                }
            }
        } catch (error) {
            console.error('Failed to refresh profile:', error);
        } finally {
            setRefreshing(false);
        }
    }, [setAuth]);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#001C3D']} />
                }
            >
                <View style={styles.content}>
                    <View style={[styles.iconContainer, isRejected && styles.rejectedIconBg]}>
                        {isRejected ? (
                            <AlertCircle size={64} color="#EF4444" />
                        ) : (
                            <Clock size={64} color="#001C3D" />
                        )}
                    </View>

                    <Text style={styles.title}>
                        {isRejected ? 'Application Update' : 'Review in Progress'}
                    </Text>

                    <Text style={styles.description}>
                        {isRejected
                            ? `We couldn't approve your application at this time.\n\nReason: ${user?.rejectedReason || 'Document inconsistency.'}\n\nPlease update your information to proceed.`
                            : "We're currently reviewing your application. Our team is working hard to get you on the road as soon as possible. This usually takes 24-48 hours."
                        }
                    </Text>

                    {!isRejected ? (
                        <View style={styles.statusBox}>
                            <View style={styles.statusItem}>
                                <View style={styles.dotContainer}>
                                    <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                                    <View style={[styles.line, { backgroundColor: '#10B981' }]} />
                                </View>
                                <View style={styles.statusInfo}>
                                    <Text style={styles.statusLabel}>Documents Submitted</Text>
                                    <Text style={styles.statusDate}>Completed</Text>
                                </View>
                            </View>

                            <View style={styles.statusItem}>
                                <View style={styles.dotContainer}>
                                    <View style={[styles.dot, { backgroundColor: '#001C3D' }]} />
                                    <View style={[styles.line, { backgroundColor: '#E2E8F0' }]} />
                                </View>
                                <View style={styles.statusInfo}>
                                    <Text style={[styles.statusLabel, { color: '#001C3D', fontWeight: '700' }]}>Background Check</Text>
                                    <Text style={styles.statusDate}>In Progress</Text>
                                </View>
                            </View>

                            <View style={[styles.statusItem, { opacity: 0.5 }]}>
                                <View style={styles.dotContainer}>
                                    <View style={[styles.dot, { backgroundColor: '#E2E8F0' }]} />
                                </View>
                                <View style={styles.statusInfo}>
                                    <Text style={styles.statusLabel}>Final Activation</Text>
                                    <Text style={styles.statusDate}>Pending Review</Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.resubmitBtn}
                            onPress={() => navigation.navigate('DocumentUpload')}
                        >
                            <Text style={styles.resubmitText}>Update Registration</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.supportText}>Need help? Contact our support team</Text>
                    <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
        paddingHorizontal: 32,
        paddingTop: 60,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    rejectedIconBg: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FEE2E2',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#001C3D',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
        fontWeight: '500',
    },
    statusBox: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    statusItem: {
        flexDirection: 'row',
        height: 70,
    },
    dotContainer: {
        alignItems: 'center',
        width: 24,
        marginRight: 16,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 6,
    },
    line: {
        width: 2,
        flex: 1,
        marginVertical: 4,
    },
    statusInfo: {
        flex: 1,
    },
    statusLabel: {
        fontSize: 16,
        color: '#475569',
        fontWeight: '600',
    },
    statusDate: {
        fontSize: 13,
        color: '#94A3B8',
        marginTop: 2,
    },
    resubmitBtn: {
        width: '100%',
        height: 56,
        borderRadius: 12,
        backgroundColor: '#001C3D',
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
        padding: 32,
        alignItems: 'center',
        paddingBottom: 60,

    },
    supportText: {
        fontSize: 14,
        color: '#94A3B8',
        marginBottom: 20,
        fontWeight: '500',
    },
    logoutBtn: {
        width: '100%',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#64748B',
    },
});

export default StatusPendingScreen;
