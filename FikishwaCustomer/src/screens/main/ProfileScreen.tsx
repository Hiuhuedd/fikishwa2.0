import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    StatusBar, ScrollView, Switch, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import {
    User, Clock, MapPin, Moon, Sun, ChevronRight, LogOut, Shield, ChevronLeft
} from 'lucide-react-native';

const ProfileScreen = () => {
    const navigation = useNavigation<any>();
    const { colors, spacing, fontSizes, isDark, toggleTheme } = useTheme();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
        ]);
    };

    const MenuItem = ({ icon, label, subtitle, onPress, rightEl }: any) => (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.menuItem, { borderBottomColor: colors.divider }]}
            activeOpacity={0.7}
        >
            <View style={[styles.menuIcon, { backgroundColor: colors.backgroundHover }]}>
                {icon}
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: fontSizes.md }}>{label}</Text>
                {subtitle && <Text style={{ color: colors.textTertiary, fontSize: fontSizes.sm }}>{subtitle}</Text>}
            </View>
            {rightEl || <ChevronRight size={16} color={colors.textTertiary} />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Header */}
                <View style={[styles.profileHeader, { backgroundColor: colors.backgroundCard, borderBottomColor: colors.border }]}>
                    <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={{ fontSize: 36 }}>👤</Text>
                    </View>
                    <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.name || 'Your Name'}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: fontSizes.md }}>{user?.phone || ''}</Text>
                </View>

                {/* Menu */}
                <View style={[styles.section, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
                    <MenuItem
                        icon={<Clock size={18} color={colors.primary} />}
                        label="Ride History"
                        subtitle="See your past trips"
                        onPress={() => navigation.navigate('RideHistory')}
                    />
                    <MenuItem
                        icon={<MapPin size={18} color={colors.primary} />}
                        label="Saved Places"
                        subtitle="Home, work & more"
                        onPress={() => { }}
                    />
                    <MenuItem
                        icon={<Shield size={18} color={colors.primary} />}
                        label="Safety"
                        subtitle="Emergency contacts & settings"
                        onPress={() => { }}
                    />
                </View>

                {/* Appearance */}
                <View style={[styles.section, { backgroundColor: colors.backgroundCard, borderColor: colors.border, marginTop: 16 }]}>
                    <MenuItem
                        icon={isDark ? <Moon size={18} color={colors.primary} /> : <Sun size={18} color={colors.primary} />}
                        label={isDark ? 'Dark Mode' : 'Light Mode'}
                        subtitle="Tap to toggle"
                        onPress={toggleTheme}
                        rightEl={
                            <Switch
                                value={isDark}
                                onValueChange={toggleTheme}
                                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                                thumbColor={isDark ? colors.primary : colors.textTertiary}
                            />
                        }
                    />
                </View>

                {/* Sign out */}
                <View style={[styles.section, { backgroundColor: colors.backgroundCard, borderColor: colors.border, marginTop: 16 }]}>
                    <MenuItem
                        icon={<LogOut size={18} color={colors.error} />}
                        label="Sign Out"
                        onPress={handleLogout}
                        rightEl={<View />}
                    />
                </View>

                <Text style={{ color: colors.textTertiary, textAlign: 'center', fontSize: fontSizes.xs, marginTop: 32 }}>
                    Fikishwa v1.0.0 · Made with ❤️ in Kenya
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    profileHeader: {
        alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20,
        borderBottomWidth: 1, marginBottom: 16,
    },
    avatar: {
        width: 88, height: 88, borderRadius: 28,
        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    name: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    section: {
        marginHorizontal: 16, borderRadius: 18, borderWidth: 1, overflow: 'hidden',
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    menuItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1,
    },
    menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});

export default ProfileScreen;
