import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { Navigation, CheckCircle2, CreditCard, MapPin } from 'lucide-react-native';

interface ActiveRidePhaseCardProps {
    status: string;
    isLoading?: boolean;
    onArrived: () => void;
    onStartRide: () => void;
    onCompleteRide: () => void;
    onConfirmPayment: () => void;
}

const ActiveRidePhaseCard = ({
    status,
    isLoading = false,
    onArrived,
    onStartRide,
    onCompleteRide,
    onConfirmPayment
}: ActiveRidePhaseCardProps) => {

    if (status === 'accepted' || status === 'picking_up') {
        return (
            <View style={styles.phaseContainer}>
                <TouchableOpacity
                    style={[styles.bigActionBtnPrimary, isLoading && styles.disabledBtn]}
                    onPress={onArrived}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Navigation size={24} color="#fff" style={{ marginRight: 10 }} />
                            <Text style={styles.bigActionBtnText}>I HAVE ARRIVED</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        );
    }

    if (status === 'arrived') {
        return (
            <View style={styles.phaseContainer}>
                <Text style={styles.phaseTitle}>PICKUP CUSTOMER</Text>
                <TouchableOpacity
                    style={[styles.bigActionBtnPrimary, { backgroundColor: colors.success }, isLoading && styles.disabledBtn]}
                    onPress={onStartRide}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <CheckCircle2 size={24} color="#fff" style={{ marginRight: 10 }} />
                            <Text style={styles.bigActionBtnText}>START RIDE</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        );
    }

    if (status === 'in_progress') {
        return (
            <View style={styles.phaseContainer}>
                <Text style={styles.phaseTitle}>TRIP IN PROGRESS</Text>
                <TouchableOpacity
                    style={[styles.bigActionBtnPrimary, { backgroundColor: colors.error }, isLoading && styles.disabledBtn]}
                    onPress={onCompleteRide}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <MapPin size={24} color="#fff" style={{ marginRight: 10 }} />
                            <Text style={styles.bigActionBtnText}>COMPLETE TRIP</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        );
    }

    if (status === 'completed') {
        return (
            <View style={styles.phaseContainer}>
                <Text style={styles.phaseTitle}>TRIP SUMMARY</Text>
                <TouchableOpacity
                    style={[styles.bigActionBtnPrimary, { backgroundColor: colors.info }, isLoading && styles.disabledBtn]}
                    onPress={onConfirmPayment}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <CreditCard size={24} color="#fff" style={{ marginRight: 10 }} />
                            <Text style={styles.bigActionBtnText}>CONFIRM PAYMENT</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        );
    }

    return null;
};

const styles = StyleSheet.create({
    phaseContainer: {
        backgroundColor: colors.background,
        padding: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
    },
    phaseTitle: {
        fontSize: 20,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: spacing.md,
        color: colors.textPrimary,
        letterSpacing: 1
    },
    bigActionBtnPrimary: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.lg,
        borderRadius: spacing.borderRadius,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 6
    },
    disabledBtn: {
        opacity: 0.7
    },
    bigActionBtnText: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 0.5
    },
});

export default ActiveRidePhaseCard;
