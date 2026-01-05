import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getConfig, updateConfig, AppConfig } from '../../services/configService';

const SettingsScreen: React.FC = () => {
    const navigation = useNavigation();
    const { logout, user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<AppConfig | null>(null);

    // Form State
    // Form State
    const [commissionRate, setCommissionRate] = useState('');
    const [maxOwed, setMaxOwed] = useState('');
    const [paybillNumber, setPaybillNumber] = useState('');
    const [supportPhone, setSupportPhone] = useState('');
    const [supportEmail, setSupportEmail] = useState('');

    // Edit Mode
    const [isEditing, setIsEditing] = useState(false);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const response = await getConfig();
            if (response.success && response.config) {
                setConfig(response.config);
                resetForm(response.config);
            }
        } catch (error) {
            console.error('Error fetching config:', error);
            Alert.alert('Error', 'Failed to load configuration');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = (data: AppConfig) => {
        setCommissionRate(data.commissionRate?.toString() || '15');
        setMaxOwed(data.maxOwedCommission?.toString() || '1000');
        setPaybillNumber(data.paybillNumber?.toString() || '');
        setSupportPhone(data.supportPhone || '');
        setSupportEmail(data.supportEmail || '');
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const openDrawer = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: async () => await logout() }
            ]
        );
    };

    const handleSave = async () => {
        if (!commissionRate || !maxOwed) {
            Alert.alert('Validation Error', 'Commission Rate and Max Owed are required');
            return;
        }

        setSaving(true);
        try {
            const updates: Partial<AppConfig> = {
                commissionRate: parseFloat(commissionRate),
                maxOwedCommission: parseFloat(maxOwed),
                paybillNumber,
                supportPhone,
                supportEmail,
            };

            const response = await updateConfig(updates);
            if (response.success) {
                setConfig(response.config);
                setIsEditing(false);
                Alert.alert('Success', 'Configuration updated successfully');
            } else {
                Alert.alert('Error', 'Failed to update configuration');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (config) resetForm(config);
        setIsEditing(false);
    };

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading settings..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
                    <Text style={styles.menuIcon}>☰</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Profile Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Admin Profile</Text>
                    <View style={styles.profileCard}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{(user?.role || 'A').charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>Administrator</Text>
                            <Text style={styles.profileDetail}>{user?.phone || 'Unknown Phone'}</Text>
                            <Text style={styles.profileDetail}>Role: {user?.role || 'Admin'}</Text>
                        </View>
                    </View>
                </View>

                {/* Configuration Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>System Configuration</Text>
                        {!isEditing && (
                            <TouchableOpacity onPress={() => setIsEditing(true)}>
                                <Text style={styles.editLink}>Edit</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Commission Rate (%)</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={commissionRate}
                                    onChangeText={setCommissionRate}
                                    keyboardType="numeric"
                                    placeholder="15"
                                />
                            ) : (
                                <Text style={styles.value}>{config?.commissionRate}%</Text>
                            )}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Max Owed Commission (KES)</Text>
                            <Text style={styles.helperText}>Drivers blocked if debt exceeds this amount</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={maxOwed}
                                    onChangeText={setMaxOwed}
                                    keyboardType="numeric"
                                    placeholder="1000"
                                />
                            ) : (
                                <Text style={styles.value}>KES {config?.maxOwedCommission?.toLocaleString()}</Text>
                            )}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Fikishwa Paybill Number</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={paybillNumber}
                                    onChangeText={setPaybillNumber}
                                    keyboardType="number-pad"
                                    placeholder="e.g. 247247"
                                />
                            ) : (
                                <Text style={styles.value}>{config?.paybillNumber || 'Not Set'}</Text>
                            )}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Support Phone</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={supportPhone}
                                    onChangeText={setSupportPhone}
                                    keyboardType="phone-pad"
                                    placeholder="+254..."
                                />
                            ) : (
                                <Text style={styles.value}>{config?.supportPhone || 'Not Set'}</Text>
                            )}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Support Email</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={supportEmail}
                                    onChangeText={setSupportEmail}
                                    keyboardType="email-address"
                                    placeholder="support@fikishwa.com"
                                    autoCapitalize="none"
                                />
                            ) : (
                                <Text style={styles.value}>{config?.supportEmail || 'Not Set'}</Text>
                            )}
                        </View>

                        {isEditing && (
                            <View style={styles.actions}>
                                <TouchableOpacity
                                    style={[styles.btn, styles.cancelBtn]}
                                    onPress={handleCancel}
                                    disabled={saving}
                                >
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.btn, styles.saveBtn]}
                                    onPress={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <LoadingSpinner size="small" color={Colors.white} />
                                    ) : (
                                        <Text style={styles.saveText}>Save Changes</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* Logout Section */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.version}>App Version 1.0.0 (Build 101)</Text>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    menuButton: {
        padding: Spacing.sm,
        marginRight: Spacing.md,
    },
    menuIcon: {
        fontSize: 24,
        color: Colors.textPrimary,
    },
    headerTitle: {
        flex: 1,
        fontSize: FontSizes.xl,
        fontWeight: FontWeights.bold,
        color: Colors.textPrimary,
    },
    content: {
        padding: Spacing.md,
        paddingBottom: Spacing.xxl,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    sectionTitle: {
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    editLink: {
        color: Colors.primary,
        fontWeight: FontWeights.medium,
        padding: Spacing.xs,
    },
    profileCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        ...Shadows.sm,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    avatarText: {
        color: Colors.white,
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.bold,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    profileDetail: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        ...Shadows.sm,
    },
    inputGroup: {
        marginBottom: Spacing.sm,
    },
    label: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    helperText: {
        fontSize: 10,
        color: Colors.textMuted,
        marginBottom: 4,
        fontStyle: 'italic',
    },
    value: {
        fontSize: FontSizes.md,
        fontWeight: FontWeights.semibold,
        color: Colors.textPrimary,
        paddingBottom: Spacing.xs,
    },
    input: { // Added input style
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
        padding: Spacing.sm,
        color: Colors.textPrimary,
        borderWidth: 1,
        borderColor: Colors.border,
        fontSize: FontSizes.md,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.md,
    },
    actions: {
        flexDirection: 'row',
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
    },
    btn: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: Colors.surfaceLight,
        marginRight: Spacing.md,
    },
    saveBtn: {
        backgroundColor: Colors.primary,
    },
    cancelText: {
        color: Colors.textPrimary,
        fontWeight: FontWeights.bold,
    },
    saveText: {
        color: Colors.white,
        fontWeight: FontWeights.bold,
    },
    logoutButton: {
        backgroundColor: Colors.error + '15', // Low opacity red
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.error + '40',
        marginBottom: Spacing.xl,
    },
    logoutText: {
        color: Colors.error,
        fontSize: FontSizes.md,
        fontWeight: FontWeights.bold,
    },
    version: {
        textAlign: 'center',
        color: Colors.textMuted,
        fontSize: FontSizes.sm,
        marginBottom: Spacing.xl,
    },
});

export default SettingsScreen;
