import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Navigation, CheckCircle2, CreditCard, MapPin, ChevronRight } from 'lucide-react-native';

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

    const renderAction = (
        title: string, 
        subtitle: string, 
        Icon: any, 
        onPress: () => void, 
        color: string = '#111111'
    ) => (
        <View style={styles.premiumContainer}>
            <View style={styles.statusHeader}>
                <View style={[styles.pulseIndicator, { backgroundColor: color }]} />
                <Text style={styles.statusSubtitle}>{subtitle}</Text>
            </View>
            <TouchableOpacity
                style={[styles.executiveBtn, { backgroundColor: color }, isLoading && styles.disabledBtn]}
                onPress={onPress}
                disabled={isLoading}
                activeOpacity={0.8}
            >
                {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <View style={styles.btnContent}>
                        <View style={styles.btnLeft}>
                            <Icon size={20} color="#fff" style={{ marginRight: 12 }} />
                            <Text style={styles.executiveBtnText}>{title}</Text>
                        </View>
                        <View style={styles.btnArrow}>
                            <ChevronRight size={20} color="#111" />
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );

    if (status === 'accepted' || status === 'picking_up') {
        return renderAction('I HAVE ARRIVED', 'NAVIGATING TO PICKUP', Navigation, onArrived, '#1A1A1A');
    }
    if (status === 'arrived') {
        return renderAction('START RIDE', 'WAITING FOR CUSTOMER', CheckCircle2, onStartRide, '#0A84FF');
    }
    if (status === 'in_progress') {
        return renderAction('COMPLETE TRIP', 'TRIP IN PROGRESS', MapPin, onCompleteRide, '#000000');
    }
    if (status === 'completed') {
        return renderAction('CONFIRM PAYMENT', 'TRIP COMPLETED', CreditCard, onConfirmPayment, '#34C759');
    }

    return null;
};

const styles = StyleSheet.create({
    premiumContainer: {
        paddingTop: 8,
        paddingBottom: 16,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        justifyContent: 'center',
    },
    pulseIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 8,
    },
    statusSubtitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    executiveBtn: {
        borderRadius: 16,
        height: 64,
        justifyContent: 'center',
        paddingHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 16,
    },
    btnLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    btnArrow: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    executiveBtnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
    disabledBtn: {
        opacity: 0.6,
    },
});

export default ActiveRidePhaseCard;
