import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    TouchableWithoutFeedback,
} from 'react-native';
import { X } from 'lucide-react-native';
import { lightColors as colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const { height } = Dimensions.get('window');

interface PremiumModalProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    heightPercentage?: number;
}

const PremiumModal = ({
    visible,
    onClose,
    title,
    children,
    heightPercentage = 0.5,
}: PremiumModalProps) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.content, { height: height * heightPercentage }]}>
                            <View style={styles.header}>
                                <View style={styles.handle} />
                                <View style={styles.titleRow}>
                                    {title && <Text style={styles.title}>{title}</Text>}
                                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                        <X size={20} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={styles.body}>
                                {children}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: colors.background,
        borderTopLeftRadius: spacing.borderRadiusLg,
        borderTopRightRadius: spacing.borderRadiusLg,
        paddingTop: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    header: {
        alignItems: 'center',
        paddingBottom: spacing.sm,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border,
        marginBottom: spacing.md,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: spacing.lg,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    closeBtn: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: colors.backgroundHover,
    },
    body: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
});

export default PremiumModal;
