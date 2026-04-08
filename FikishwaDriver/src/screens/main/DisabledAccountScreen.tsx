import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import { ShieldAlert, CreditCard, Phone, MessageSquare } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'Home'>;

const DisabledAccountScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<any>();
    const { owedAmount, maxLimit } = route.params || { owedAmount: 0, maxLimit: 400 };

    const handlePayNow = () => {
        (navigation as any).navigate('Earnings');
    };

    const handleCallSupport = () => {
        Linking.openURL('tel:+254743466032');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <ShieldAlert size={80} color="#FF3B30" />
                </View>

                <Text style={styles.title}>Account Disabled</Text>

                <View style={styles.infoBox}>
                    <Text style={styles.message}>
                        Your account has been temporarily disabled due to outstanding commissions.
                    </Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Current Owed</Text>
                            <Text style={styles.statValue}>KES {owedAmount.toFixed(2)}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Limit</Text>
                            <Text style={styles.statValue}>KES {maxLimit.toFixed(2)}</Text>
                        </View>
                    </View>

                    <Text style={styles.subMessage}>
                        Please settle your balance to resume operations and start receiving new ride requests.
                    </Text>
                </View>

                <TouchableOpacity style={styles.payButton} onPress={handlePayNow}>
                    <CreditCard size={20} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.payButtonText}>Settle Balance Now</Text>
                </TouchableOpacity>

                <View style={styles.supportSection}>
                    <Text style={styles.supportTitle}>Need help?</Text>
                    <View style={styles.supportButtons}>
                        <TouchableOpacity style={styles.supportButton} onPress={handleCallSupport}>
                            <Phone size={18} color="#001C3D" />
                            <Text style={styles.supportButtonText}>Call Support</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.supportButton} onPress={() => { }}>
                            <MessageSquare size={18} color="#001C3D" />
                            <Text style={styles.supportButtonText}>Live Chat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#FFF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 16,
    },
    infoBox: {
        width: '100%',
        backgroundColor: '#F8F9FB',
        borderRadius: 20,
        padding: 24,
        marginBottom: 32,
        alignItems: 'center',
    },
    message: {
        fontSize: 16,
        color: '#3A3A3C',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        width: '100%',
        marginBottom: 24,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FF3B30',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#F2F2F7',
    },
    subMessage: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
    },
    payButton: {
        width: '100%',
        backgroundColor: '#001C3D',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    payButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    supportSection: {
        width: '100%',
        alignItems: 'center',
    },
    supportTitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 16,
    },
    supportButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    supportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    supportButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#001C3D',
    },
});

export default DisabledAccountScreen;
