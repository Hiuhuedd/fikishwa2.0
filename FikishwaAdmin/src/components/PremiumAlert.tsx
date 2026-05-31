import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '../theme';

export interface PremiumAlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface PremiumAlertProps {
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'warning' | 'error' | 'info';
    buttons?: PremiumAlertButton[];
}

const PremiumAlert = ({
    visible,
    title,
    message,
    type = 'info',
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
                    <View style={styles.iconContainer}>
                        {type === 'success' && <CheckCircle2 size={48} color={Colors.success || '#34C759'} />}
                        {type === 'warning' && <AlertTriangle size={48} color={Colors.warning || '#FFCC00'} />}
                        {type === 'error' && <XCircle size={48} color={Colors.error || '#FF3B30'} />}
                        {type === 'info' && <Info size={48} color={Colors.primary} />}
                    </View>
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
        padding: Spacing.xl,
    },
    alertBox: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 24,
    },
    iconContainer: {
        marginBottom: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    message: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: Spacing.md,
    },
    button: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    cancelBtn: {
        backgroundColor: Colors.surfaceLight,
    },
    cancelText: {
        color: Colors.textSecondary,
    },
    destructiveBtn: {
        backgroundColor: Colors.error,
    },
    destructiveText: {
        color: '#fff',
    },
    verticalBtn: {
        width: '100%',
        marginBottom: Spacing.sm,
    }
});

export default PremiumAlert;
