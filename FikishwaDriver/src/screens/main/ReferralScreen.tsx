import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Share, ActivityIndicator, Image } from 'react-native';
import { ChevronLeft, Gift, Copy, Share2, Users, Award, Info } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import api from '../../services/api';
import driverApiService from '../../services/driverApiService';

const ReferralScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [referralData, setReferralData] = useState<any>(null);
    const [bonuses, setBonuses] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            const [refRes, bonusRes] = await Promise.all([
                driverApiService.getReferralCode(),
                driverApiService.getBonuses()
            ]);
            if (refRes.data.success) {
                setReferralData(refRes.data);
            }
            if (bonusRes.data.success) {
                setBonuses(bonusRes.data.bonuses || []);
            }
        } catch (error) {
            console.error('Failed to fetch referral data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const copyToClipboard = async () => {
        if (referralData?.referralCode) {
            await Clipboard.setStringAsync(referralData.referralCode);
            // In a real app, we'd show a toast here
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Join Fikishwa as a driver using my code ${referralData?.referralCode} and start earning premium bonuses today!`,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={28} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Invite & Earn</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Hero section */}
                <View style={styles.heroSection}>
                    <View style={styles.giftIconContainer}>
                        <Gift size={48} color="#007AFF" />
                    </View>
                    <Text style={styles.heroTitle}>Invite your friends</Text>
                    <Text style={styles.heroSub}>Earn up to KES 500 for every driver who completes 10 rides using your code.</Text>
                </View>

                {/* Referral Code Box */}
                <View style={styles.codeBox}>
                    <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
                    <View style={styles.codeInner}>
                        <Text style={styles.codeText}>{referralData?.referralCode || 'REF----'}</Text>
                        <View style={styles.codeActions}>
                            <TouchableOpacity onPress={copyToClipboard} style={styles.actionIcon}>
                                <Copy size={20} color="#007AFF" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleShare} style={styles.actionIcon}>
                                <Share2 size={20} color="#007AFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Users size={24} color="#5856D6" />
                        <Text style={styles.statValue}>{referralData?.totalReferred || 0}</Text>
                        <Text style={styles.statLabel}>Invites</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Award size={24} color="#FF9500" />
                        <Text style={styles.statValue}>KES {referralData?.earnedFromReferrals || 0}</Text>
                        <Text style={styles.statLabel}>Earned</Text>
                    </View>
                </View>

                {/* How it works */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How it works</Text>
                    <View style={styles.stepItem}>
                        <View style={[styles.stepDot, { backgroundColor: '#001C3D' }]}><Text style={styles.stepNumber}>1</Text></View>
                        <Text style={styles.stepText}>Share your code with other drivers</Text>
                    </View>
                    <View style={styles.stepItem}>
                        <View style={[styles.stepDot, { backgroundColor: '#001C3D' }]}><Text style={styles.stepNumber}>2</Text></View>
                        <Text style={styles.stepText}>They register and get verified</Text>
                    </View>
                    <View style={styles.stepItem}>
                        <View style={[styles.stepDot, { backgroundColor: '#001C3D' }]}><Text style={styles.stepNumber}>3</Text></View>
                        <Text style={styles.stepText}>You get KES 500 after their 10th ride</Text>
                    </View>
                </View>

                {/* Recent Bonuses */}
                {bonuses.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recent Bonuses</Text>
                        {bonuses.map((bonus, index) => (
                            <View key={index} style={styles.bonusItem}>
                                <View style={styles.bonusIcon}>
                                    <Gift size={20} color="#4CD964" />
                                </View>
                                <View style={styles.bonusDetails}>
                                    <Text style={styles.bonusTitle}>{bonus.reason}</Text>
                                    <Text style={styles.bonusDate}>{new Date(bonus.date).toLocaleDateString()}</Text>
                                </View>
                                <Text style={styles.bonusAmount}>+KES {bonus.amount}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FB',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    scrollContent: {
        padding: 20,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    giftIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E6F0FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    heroSub: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    codeBox: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    codeLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: 1,
    },
    codeInner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    codeText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        letterSpacing: 2,
    },
    codeActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionIcon: {
        padding: 4,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A1A1A',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 2,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 16,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    stepDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stepNumber: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    stepText: {
        fontSize: 15,
        color: '#1A1A1A',
    },
    bonusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    bonusIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#E8F9EE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    bonusDetails: {
        flex: 1,
    },
    bonusTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    bonusDate: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 2,
    },
    bonusAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4CD964',
    },
});

export default ReferralScreen;
