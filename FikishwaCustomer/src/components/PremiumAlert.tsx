import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { lightColors as colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface PremiumAlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface PremiumAlertProps {
    visible: boolean;
    title: string;
    message: string;
    buttons?: PremiumAlertButton[];
}

const PremiumAlert = ({
    visible,
    title,
    message,
    buttons = [{ text: 'OK' }],
}: PremiumAlertProps) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
        >
            <View style={styles.overlay}>
                <View style={styles.alertBox}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <View style={styles.buttonContainer}>
                        {buttons.map((btn, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.button,
                                    btn.style === 'destructive' && styles.destructiveBtn,
                                    btn.style === 'cancel' && styles.cancelBtn,
                                    buttons.length > 2 && styles.verticalBtn
                                ]}
                                onPress={btn.onPress}
                            >
                                <Text style={[
                                    styles.buttonText,
                                    btn.style === 'destructive' && styles.destructiveText,
                                    btn.style === 'cancel' && styles.cancelText,
                                ]}>
                                    {btn.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    alertBox: {
        backgroundColor: colors.background,
        borderRadius: spacing.borderRadiusLg,
        padding: spacing.lg,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: spacing.sm,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    message: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: spacing.md,
    },
    button: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: spacing.borderRadius,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textOnPrimary,
    },
    cancelBtn: {
        backgroundColor: colors.backgroundHover,
    },
    cancelText: {
        color: colors.textSecondary,
    },
    destructiveBtn: {
        backgroundColor: colors.error,
    },
    destructiveText: {
        color: '#fff',
    },
    verticalBtn: {
        width: '100%',
        marginBottom: spacing.sm,
    }
});

export default PremiumAlert;
