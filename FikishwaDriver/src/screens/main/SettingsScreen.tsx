import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
} from 'react-native';
import { Colors, Spacing, FontSizes } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import {
    Bell,
    Lock,
    HelpCircle,
    Info,
    LogOut,
    ChevronRight,
    Shield,
    Trash2
} from 'lucide-react-native';

const SettingsScreen = () => {
    const { logout } = useAuthStore();
    const [notifications, setNotifications] = React.useState(true);

    const renderSettingItem = (icon: any, label: string, onPress?: () => void, rightElement?: any) => (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: Colors.backgroundLighter }]}>
                    {icon}
                </View>
                <Text style={styles.settingLabel}>{label}</Text>
            </View>
            {rightElement || <ChevronRight size={18} color={Colors.textTertiary} />}
        </TouchableOpacity>
    );

    const handleLogout = () => {
        logout();
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Preferences</Text>
                <View style={styles.card}>
                    {renderSettingItem(
                        <Bell size={20} color={Colors.primary} />,
                        'Push Notifications',
                        undefined,
                        <Switch
                            value={notifications}
                            onValueChange={setNotifications}
                            trackColor={{ false: Colors.border, true: Colors.primary }}
                            thumbColor={Colors.white}
                        />
                    )}
                    <View style={styles.divider} />
                    {renderSettingItem(<Lock size={20} color={Colors.primary} />, 'Privacy Settings')}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support & Safety</Text>
                <View style={styles.card}>
                    {renderSettingItem(<HelpCircle size={20} color={Colors.warning} />, 'Help Center')}
                    <View style={styles.divider} />
                    {renderSettingItem(<Shield size={20} color={Colors.primary} />, 'Safety Center')}
                    <View style={styles.divider} />
                    {renderSettingItem(<Info size={20} color={Colors.textSecondary} />, 'About Fikishwa')}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 68, 68, 0.1)' }]}>
                                <LogOut size={20} color={Colors.error} />
                            </View>
                            <Text style={[styles.settingLabel, { color: Colors.error }]}>Log Out</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.settingItem} onPress={() => { }}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: 'transparent' }]}>
                                <Trash2 size={20} color={Colors.textTertiary} />
                            </View>
                            <Text style={[styles.settingLabel, { color: Colors.textTertiary }]}>Delete Account</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={styles.versionText}>Version 0.0.1 (Alpha)</Text>
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
    section: {
        marginTop: Spacing.lg,
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
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    settingLabel: {
        fontSize: FontSizes.md,
        color: Colors.white,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 4,
        marginLeft: 52,
    },
    versionText: {
        textAlign: 'center',
        color: Colors.textTertiary,
        fontSize: 12,
        marginTop: Spacing.xxl,
        marginBottom: 40,
    }
});

export default SettingsScreen;
