import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Linking } from 'react-native';
import { Shield, Share2, PhoneCall, AlertTriangle, X } from 'lucide-react-native';
import PremiumModal from './PremiumModal';
import { useTheme } from '../theme/ThemeContext';

interface SafetyToolkitModalProps {
    visible: boolean;
    onClose: () => void;
    rideId: string;
    pickup: any;
    dropoff: any;
    driver: any;
}

const SafetyToolkitModal: React.FC<SafetyToolkitModalProps> = ({
    visible,
    onClose,
    rideId,
    pickup,
    dropoff,
    driver,
}) => {
    const { colors, fontSizes, spacing } = useTheme();

    const handleShareTrip = async () => {
        try {
            const message = `I'm on a Fikishwa ride!\n\nDriver: ${driver?.name}\nVehicle: ${driver?.vehicleMake} ${driver?.vehicleModel} (${driver?.plateNumber})\nPickup: ${pickup?.address}\nDropoff: ${dropoff?.address}\n\nTrack my trip: https://fikishwa.com/track/${rideId}`;
            await Share.share({
                message,
                title: 'Share Trip Details',
            });
        } catch (error) {
            console.error('Error sharing trip:', error);
        }
    };

    const handleEmergencyCall = () => {
        Linking.openURL('tel:999');
    };

    const safetyOptions = [
        {
            id: 'share',
            title: 'Share Trip Status',
            subtitle: 'Let others know your location',
            icon: <Share2 size={24} color={colors.primary} />,
            onPress: handleShareTrip,
        },
        {
            id: 'emergency',
            title: 'Emergency Assistance',
            subtitle: 'Call local emergency services (999)',
            icon: <PhoneCall size={24} color={colors.error} />,
            onPress: handleEmergencyCall,
            isCritical: true,
        },
        {
            id: 'report',
            title: 'Report Safety Issue',
            subtitle: 'Discreetly report an issue to support',
            icon: <AlertTriangle size={24} color={colors.warning} />,
            onPress: () => {
                // Placeholder for reporting logic
                onClose();
            },
        },
    ];

    return (
        <PremiumModal
            visible={visible}
            onClose={onClose}
            title="Safety Toolkit"
            heightPercentage={0.55}
        >
            <View style={styles.container}>
                <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: fontSizes.sm }]}>
                    Your safety is our priority. Choose an option if you feel unsafe or need help.
                </Text>

                <View style={styles.optionsList}>
                    {safetyOptions.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.optionItem,
                                {
                                    backgroundColor: option.isCritical ? colors.error + '10' : colors.backgroundHover,
                                    borderColor: option.isCritical ? colors.error + '30' : colors.border
                                }
                            ]}
                            onPress={option.onPress}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: option.isCritical ? colors.error + '15' : colors.primary + '10' }]}>
                                {option.icon}
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={[styles.optionTitle, { color: option.isCritical ? colors.error : colors.textPrimary, fontSize: fontSizes.md }]}>
                                    {option.title}
                                </Text>
                                <Text style={[styles.optionSubtitle, { color: colors.textTertiary, fontSize: fontSizes.xs }]}>
                                    {option.subtitle}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.closeBtn, { backgroundColor: colors.backgroundHover }]}
                    onPress={onClose}
                >
                    <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Back to Ride</Text>
                </TouchableOpacity>
            </View>
        </PremiumModal>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 4,
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 18,
    },
    optionsList: {
        gap: 12,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    optionTitle: {
        fontWeight: '800',
        marginBottom: 2,
    },
    optionSubtitle: {
        fontWeight: '500',
    },
    closeBtn: {
        marginTop: 24,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default SafetyToolkitModal;
