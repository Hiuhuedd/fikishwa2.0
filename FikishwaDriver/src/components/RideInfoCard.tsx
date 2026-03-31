import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { User, X, Gift, ChevronRight, Phone } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

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
            <View style={styles.customerRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.avatarSmall}>
                        <User size={24} color={colors.textPrimary} />
                    </View>
                    <View style={{ marginLeft: spacing.md }}>
                        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>
                            {activeRide.customerName || 'Customer'}
                        </Text>
                        <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '500' }}>
                            ID: {activeRide.rideId?.substring(0, 8)}
                        </Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity style={styles.cancelBtnSmall} onPress={onShowCancelModal}>
                        <X size={22} color={colors.error} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.callBtnSmall} onPress={onCallCustomer}>
                        <Phone size={16} color={colors.primary} />
                        <Text style={styles.callText}>CALL</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View>
            <View style={styles.infoRow}>
                <View>
                    <Text style={styles.greetingText}>Hello, {user?.name || 'Driver'}</Text>
                    <Text style={styles.subText}>Ready to start earning?</Text>
                </View>
                <TouchableOpacity style={styles.earningBadge} onPress={onNavigateToEarnings}>
                    <Text style={styles.earningAmount}>KES {todayEarnings.toFixed(2)}</Text>
                    <Text style={styles.earningLabel}>Today</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.promoCard} onPress={onNavigateToReferral}>
                <View style={styles.promoIcon}>
                    <Gift size={24} color="#5856D6" />
                </View>
                <View style={styles.promoContent}>
                    <Text style={styles.promoTitle}>Invite & Earn</Text>
                    <Text style={styles.promoSub}>Get KES 500 per referral</Text>
                </View>
                <ChevronRight size={20} color="#C7C7CC" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    customerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
        justifyContent: 'space-between'
    },
    avatarSmall: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.backgroundHover,
        alignItems: 'center',
        justifyContent: 'center'
    },
    cancelBtnSmall: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.error + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm
    },
    callBtnSmall: {
        backgroundColor: colors.primary + '15',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: spacing.borderRadiusSm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    callText: {
        color: colors.primary,
        fontWeight: '800',
        fontSize: 14,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    greetingText: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.5
    },
    subText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2
    },
    earningBadge: {
        alignItems: 'flex-end',
        backgroundColor: colors.primary + '10',
        padding: spacing.sm,
        borderRadius: spacing.borderRadius,
    },
    earningAmount: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.primary
    },
    earningLabel: {
        fontSize: 11,
        color: colors.textSecondary,
        fontWeight: '600',
        textTransform: 'uppercase'
    },
    promoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: spacing.borderRadiusLg,
        padding: spacing.md,
        marginTop: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 4
    },
    promoIcon: {
        width: 48,
        height: 48,
        borderRadius: spacing.borderRadius,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md
    },
    promoContent: { flex: 1 },
    promoTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary
    },
    promoSub: {
        fontSize: 13,
        color: colors.textSecondary
    },
});

export default RideInfoCard;
