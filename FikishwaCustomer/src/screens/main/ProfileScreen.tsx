import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    StatusBar, ScrollView, Switch, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import {
    User, Clock, MapPin, Moon, Sun, ChevronRight, LogOut, Shield, ChevronLeft,
    Settings, Bell, CreditCard, HelpCircle
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

    const MenuItem = ({ icon, label, subtitle, onPress, rightEl, last }: any) => (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.menuItem,
                { borderBottomColor: colors.divider },
                last && { borderBottomWidth: 0 }
            ]}
            activeOpacity={0.7}
        >
            <View style={[styles.menuIcon, { backgroundColor: colors.primary + '10' }]}>
                {icon}
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: fontSizes.md }}>{label}</Text>
                {subtitle && <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 2 }}>{subtitle}</Text>}
            </View>
            {rightEl || <ChevronRight size={16} color={colors.textTertiary} />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Custom Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, { backgroundColor: colors.backgroundCard }]}
                >
                    <ChevronLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Account</Text>
                <TouchableOpacity style={[styles.headerIcon, { backgroundColor: colors.backgroundCard }]}>
                    <Settings size={20} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                {/* Profile Info Card */}
                <View style={[styles.profileCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
                    <View style={[styles.avatarContainer, { borderColor: colors.primary + '30' }]}>
                        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                            <User size={40} color="#FFF" />
                        </View>
                        <TouchableOpacity style={[styles.editBadge, { backgroundColor: colors.secondary }]}>
                            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>EDIT</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.name || 'Your Name'}</Text>
                    <Text style={[styles.phone, { color: colors.textSecondary }]}>{user?.phone || 'No phone'}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.primary }]}>4.9</Text>
                            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Rating</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.primary }]}>28</Text>
                            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Trips</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.primary }]}>KES 0</Text>
                            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Credits</Text>
                        </View>
                    </View>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>ACTIVITY</Text>
                <View style={[styles.section, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
                    <MenuItem
                        icon={<Clock size={18} color={colors.primary} />}
                        label="Ride History"
                        subtitle="Detailed view of your past trips"
                        onPress={() => navigation.navigate('RideHistory')}
                    />
                    <MenuItem
                        icon={<MapPin size={18} color={colors.primary} />}
                        label="Saved Places"
                        subtitle="Manage home, work & favorite spots"
                        onPress={() => navigation.navigate('SavedPlaces')}
                        last
                    />
                </View>

                <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>SETTINGS</Text>
                <View style={[styles.section, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
                    <MenuItem
                        icon={<CreditCard size={18} color={colors.primary} />}
                        label="Payments"
                        subtitle="Cards, M-Pesa & wallets"
                        onPress={() => { }}
                    />
                    <MenuItem
                        icon={<Bell size={18} color={colors.primary} />}
                        label="Notifications"
                        onPress={() => { }}
                    />
                    <MenuItem
                        icon={isDark ? <Moon size={18} color={colors.primary} /> : <Sun size={18} color={colors.primary} />}
                        label={isDark ? 'Dark Mode' : 'Light Mode'}
                        onPress={toggleTheme}
                        rightEl={
                            <Switch
                                value={isDark}
                                onValueChange={toggleTheme}
                                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                                thumbColor={isDark ? colors.primary : colors.textTertiary}
                            />
                        }
                        last
                    />
                </View>

                <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>SUPPORT</Text>
                <View style={[styles.section, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
                    <MenuItem
                        icon={<Shield size={18} color={colors.primary} />}
                        label="Safety & Security"
                        onPress={() => { }}
                    />
                    <MenuItem
                        icon={<HelpCircle size={18} color={colors.primary} />}
                        label="Help Center"
                        onPress={() => { }}
                        last
                    />
                </View>

                {/* Sign out */}
                <TouchableOpacity
                    onPress={handleLogout}
                    style={[styles.logoutBtn, { borderColor: colors.error + '30' }]}
                >
                    <LogOut size={20} color={colors.error} />
                    <Text style={[styles.logoutText, { color: colors.error }]}>Sign Out</Text>
                </TouchableOpacity>

                <Text style={{ color: colors.textTertiary, textAlign: 'center', fontSize: 10, marginTop: 32, opacity: 0.7 }}>
                    FIKISHWA CUSTOMER APP · V2.1.0
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
    },
    backButton: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '800' },
    headerIcon: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
    },
    profileCard: {
        margin: 20, padding: 24, borderRadius: 32, borderWidth: 1,
        alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 5,
    },
    avatarContainer: {
        padding: 4, borderWidth: 2, borderRadius: 40, marginBottom: 16,
        position: 'relative',
    },
    avatar: {
        width: 72, height: 72, borderRadius: 36,
        alignItems: 'center', justifyContent: 'center',
    },
    editBadge: {
        position: 'absolute', bottom: 0, right: -4,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
        borderWidth: 2, borderColor: '#FFF',
    },
    name: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
    phone: { fontSize: 14, fontWeight: '500', marginBottom: 20 },
    statsRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 16, fontWeight: '800' },
    statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    statDivider: { width: 1, height: 24 },
    sectionTitle: {
        marginLeft: 24, marginBottom: 10, marginTop: 20,
        fontSize: 12, fontWeight: '800', letterSpacing: 1,
    },
    section: {
        marginHorizontal: 20, borderRadius: 24, borderWidth: 1, overflow: 'hidden',
        shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
    },
    menuItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 18, borderBottomWidth: 1,
    },
    menuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    logoutBtn: {
        marginHorizontal: 20, marginTop: 32, height: 56, borderRadius: 24,
        borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    logoutText: { fontSize: 16, fontWeight: '800' },
});

export default ProfileScreen;
