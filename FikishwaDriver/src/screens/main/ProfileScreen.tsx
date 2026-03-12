import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
} from 'react-native';
import { Colors, Spacing, FontSizes } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import {
    User,
    Car,
    ShieldCheck,
    ChevronRight,
    Camera,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle
} from 'lucide-react-native';

const ProfileScreen = () => {
    const { user } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);

    const renderInfoRow = (icon: any, label: string, value: string) => (
        <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
                {icon}
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value || 'Not set'}</Text>
            </View>
        </View>
    );

    const renderDocumentItem = (label: string, status: 'approved' | 'pending' | 'rejected' | 'missing') => {
        const getStatusStyles = () => {
            switch (status) {
                case 'approved': return { color: Colors.primary, icon: <CheckCircle2 size={18} color={Colors.primary} />, label: 'Verified' };
                case 'pending': return { color: Colors.warning, icon: <Clock size={18} color={Colors.warning} />, label: 'Under Review' };
                case 'rejected': return { color: Colors.error, icon: <AlertCircle size={18} color={Colors.error} />, label: 'Action Required' };
                default: return { color: Colors.textTertiary, icon: <FileText size={18} color={Colors.textTertiary} />, label: 'Missing' };
            }
        };

        const { color, icon, label: statusLabel } = getStatusStyles();

        return (
            <TouchableOpacity style={styles.docItem} activeOpacity={0.7}>
                <View style={styles.docLeft}>
                    {icon}
                    <Text style={styles.docName}>{label}</Text>
                </View>
                <View style={styles.docRight}>
                    <Text style={[styles.statusText, { color }]}>{statusLabel}</Text>
                    <ChevronRight size={16} color={Colors.textTertiary} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header / Avatar */}
            <View style={styles.header}>
                <View style={styles.avatarWrapper}>
                    {user?.profilePhotoUrl ? (
                        <Image source={{ uri: user.profilePhotoUrl }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <User size={40} color={Colors.textTertiary} />
                        </View>
                    )}
                    <TouchableOpacity style={styles.cameraButton} activeOpacity={0.8}>
                        <Camera size={16} color={Colors.white} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.name}>{user?.name || 'Driver Name'}</Text>
                <Text style={styles.role}>Premium Partner</Text>
            </View>

            {/* Personal Details */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personal Details</Text>
                <View style={styles.card}>
                    {renderInfoRow(<User size={20} color={Colors.primary} />, 'Phone Number', user?.phone || '')}
                    <View style={styles.divider} />
                    {renderInfoRow(<FileText size={20} color={Colors.primary} />, 'Email Address', user?.email || 'driver@fikishwa.com')}
                </View>
            </View>

            {/* Vehicle Details */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Vehicle Information</Text>
                <View style={styles.card}>
                    {renderInfoRow(<Car size={20} color={Colors.primary} />, 'Vehicle', user?.carMake ? `${user.carMake} ${user.carModel || ''}` : 'Toyota Vitz')}
                    <View style={styles.divider} />
                    {renderInfoRow(<ShieldCheck size={20} color={Colors.primary} />, 'Registration', user?.plateNumber || 'KDL 123X')}
                </View>
            </View>

            {/* Document Vault */}
            <View style={[styles.section, { marginBottom: 40 }]}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Document Vault</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Security</Text>
                    </View>
                </View>
                <View style={styles.card}>
                    {renderDocumentItem('Driving License', user?.registrationStatus === 'approved' ? 'approved' : 'pending')}
                    <View style={styles.divider} />
                    {renderDocumentItem('Good Conduct Cert', user?.registrationStatus === 'approved' ? 'approved' : 'pending')}
                    <View style={styles.divider} />
                    {renderDocumentItem('Vehicle Logbook', user?.registrationStatus === 'approved' ? 'approved' : 'pending')}
                    <View style={styles.divider} />
                    {renderDocumentItem('Insurance Cover', user?.registrationStatus === 'approved' ? 'approved' : 'pending')}
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: Spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginVertical: Spacing.xl,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: Spacing.md,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: Colors.primary,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.backgroundLighter,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: Colors.border,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: Colors.background,
    },
    name: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
        color: Colors.white,
    },
    role: {
        fontSize: FontSizes.sm,
        color: Colors.primary,
        fontWeight: '600',
        marginTop: 4,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    section: {
        marginTop: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    sectionTitle: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginLeft: 4,
        marginBottom: Spacing.sm,
    },
    card: {
        backgroundColor: Colors.backgroundLight,
        borderRadius: 20,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(29, 185, 84, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    textContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 10,
        color: Colors.textTertiary,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: FontSizes.md,
        color: Colors.white,
        fontWeight: '500',
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 8,
        marginLeft: 52,
    },
    docItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    docLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    docName: {
        color: Colors.white,
        fontSize: FontSizes.md,
        fontWeight: '500',
    },
    docRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    badge: {
        backgroundColor: 'rgba(29, 185, 84, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 10,
        color: Colors.primary,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    }
});

export default ProfileScreen;
