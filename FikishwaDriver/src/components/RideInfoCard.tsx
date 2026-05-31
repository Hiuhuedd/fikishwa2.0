import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { User, X, Gift, ChevronRight, Phone, Navigation } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface RideInfoCardProps {
    activeRide: any;
    user: any;
    todayEarnings: number;
    onShowCancelModal: () => void;
    onCallCustomer: () => void;
    onNavigateToEarnings: () => void;
    onNavigateToReferral: () => void;
}

const RideInfoCard = ({
    activeRide,
    user,
    todayEarnings,
    onShowCancelModal,
    onCallCustomer,
    onNavigateToEarnings,
    onNavigateToReferral,
}: RideInfoCardProps) => {
    if (activeRide) {
        return (
            <View style={styles.premiumCard}>
                <View style={styles.riderHeader}>
                    <View style={styles.riderProfile}>
                        <View style={styles.avatarExecutive}>
                            <User size={20} color="#111" />
                        </View>
                        <View style={{ marginLeft: 12 }}>
                            <Text style={styles.riderName}>
                                {activeRide.customerName || 'Customer'}
                            </Text>
                            <Text style={styles.riderMeta}>
                                VIP Rider • {activeRide.paymentMethod === 'cash' ? 'CASH' : 'M-PESA'}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={styles.actionGroup}>
                        <TouchableOpacity style={styles.iconBtn} onPress={onCallCustomer}>
                            <Phone size={18} color="#111" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#FFF0F0' }]} onPress={onShowCancelModal}>
                            <X size={18} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.routeContainer}>
                    <View style={styles.routeTimeline}>
                        <View style={[styles.timelineDot, { backgroundColor: '#111' }]} />
                        <View style={styles.timelineLine} />
                        <View style={[styles.timelineDot, { backgroundColor: '#0A84FF', borderRadius: 2 }]} />
                    </View>
                    <View style={styles.addressContainer}>
                        <View style={styles.addressBlock}>
                            <Text style={styles.addressLabel}>PICKUP</Text>
                            <Text style={styles.addressValue} numberOfLines={2}>
                                {activeRide.pickup?.address || 'See Map for pickup location'}
                            </Text>
                        </View>
                        <View style={[styles.addressBlock, { marginTop: 16 }]}>
                            <Text style={styles.addressLabel}>DROPOFF</Text>
                            <Text style={styles.addressValue} numberOfLines={2}>
                                {activeRide.dropoff?.address || 'See Map for dropoff location'}
                            </Text>
                        </View>
                    </View>
                </View>

                {activeRide.status === 'completed' && (
                    <View style={styles.fareHighlightBox}>
                        <Text style={styles.fareLabel}>Total Fare</Text>
                        <Text style={styles.fareAmount}>KES {Number(activeRide.fare || activeRide.estimatedFare || 0).toLocaleString('en-US')}</Text>
                    </View>
                )}
            </View>
        );
    }

    // Default Home State
    return (
        <View>
            <View style={styles.homeHeaderRow}>
                <View>
                    <Text style={styles.homeGreeting}>Good to see you,</Text>
                    <Text style={styles.homeName}>{user?.name || 'Partner'}</Text>
                </View>
                <TouchableOpacity style={styles.executiveEarningsBadge} onPress={onNavigateToEarnings}>
                    <Text style={styles.earningsLabelTop}>TODAY</Text>
                    <Text style={styles.earningsValueTop}>KES {todayEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.executivePromoCard} onPress={onNavigateToReferral}>
                <View style={styles.promoContentLeft}>
                    <View style={styles.promoIconContainer}>
                        <Gift size={20} color="#111" />
                    </View>
                    <View>
                        <Text style={styles.promoExecutiveTitle}>Driver Referral</Text>
                        <Text style={styles.promoExecutiveSub}>Earn KES 500 per activation</Text>
                    </View>
                </View>
                <ChevronRight size={20} color="#111" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    premiumCard: {
        marginTop: 12,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
    },
    riderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    riderProfile: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarExecutive: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    riderName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111',
        letterSpacing: -0.5,
    },
    riderMeta: {
        fontSize: 11,
        fontWeight: '700',
        color: '#8E8E93',
        marginTop: 4,
        letterSpacing: 0.5,
    },
    actionGroup: {
        flexDirection: 'row',
        gap: 8,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#F2F2F7',
        marginVertical: 20,
    },
    routeContainer: {
        flexDirection: 'row',
    },
    routeTimeline: {
        alignItems: 'center',
        marginRight: 16,
        paddingTop: 4,
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    timelineLine: {
        width: 1.5,
        height: 32,
        backgroundColor: '#E5E5EA',
        marginVertical: 4,
    },
    addressContainer: {
        flex: 1,
    },
    addressBlock: {
        justifyContent: 'center',
    },
    addressLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 1,
        marginBottom: 4,
    },
    addressValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111',
        lineHeight: 20,
    },
    fareHighlightBox: {
        marginTop: 24,
        padding: 16,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fareLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    fareAmount: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111',
    },

    // Home State Styles
    homeHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    homeGreeting: {
        fontSize: 14,
        color: '#8E8E93',
        fontWeight: '600',
        marginBottom: 2,
    },
    homeName: {
        fontSize: 26,
        fontWeight: '900',
        color: '#111',
        letterSpacing: -1,
    },
    executiveEarningsBadge: {
        alignItems: 'flex-end',
    },
    earningsLabelTop: {
        fontSize: 11,
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 1,
        marginBottom: 2,
    },
    earningsValueTop: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111',
    },
    executivePromoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginTop: 24,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    promoContentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    promoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    promoExecutiveTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#111',
    },
    promoExecutiveSub: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
        marginTop: 2,
    },
});

export default RideInfoCard;
