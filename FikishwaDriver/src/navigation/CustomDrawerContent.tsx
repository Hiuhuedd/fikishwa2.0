import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    SafeAreaView,
} from 'react-native';
import {
    DrawerContentScrollView,
    DrawerItemList,
    DrawerItem,
} from '@react-navigation/drawer';
import { Colors, Spacing, FontSizes } from '../theme';
import { useAuthStore } from '../store/authStore';
import {
    User,
    Home,
    Wallet,
    Settings,
    LogOut,
    ShieldCheck,
    Clock,
    Star
} from 'lucide-react-native';

const CustomDrawerContent = (props: any) => {
    const { user, logout } = useAuthStore();
    const { state, navigation } = props;

    const activeRouteName = state.routeNames[state.index];

    const menuItems = [
        { name: 'Home', icon: <Home size={22} color={activeRouteName === 'Home' ? Colors.primary : Colors.textSecondary} />, label: 'Dashboard' },
        { name: 'Earnings', icon: <Wallet size={22} color={activeRouteName === 'Earnings' ? Colors.primary : Colors.textSecondary} />, label: 'Earnings' },
        { name: 'Profile', icon: <User size={22} color={activeRouteName === 'Profile' ? Colors.primary : Colors.textSecondary} />, label: 'My Profile' },
        { name: 'Settings', icon: <Settings size={22} color={activeRouteName === 'Settings' ? Colors.primary : Colors.textSecondary} />, label: 'Settings' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Drawer Header */}
            <View style={styles.header}>
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        {user?.profilePhotoUrl ? (
                            <Image source={{ uri: user.profilePhotoUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <User size={30} color={Colors.textTertiary} />
                            </View>
                        )}
                        <View style={styles.statusBadge} />
                    </View>
                    <View style={styles.driverInfo}>
                        <Text style={styles.driverName} numberOfLines={1}>{user?.name || 'Driver'}</Text>
                        <View style={styles.ratingRow}>
                            <Star size={12} color={Colors.warning} fill={Colors.warning} />
                            <Text style={styles.ratingText}>4.9 • </Text>
                            <Text style={styles.statusText}>Online</Text>
                        </View>
                    </View>
                </View>
            </View>

            <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
                <View style={styles.menuContainer}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.name}
                            style={[
                                styles.menuItem,
                                activeRouteName === item.name && styles.activeMenuItem
                            ]}
                            onPress={() => navigation.navigate(item.name)}
                        >
                            <View style={styles.menuIconContainer}>
                                {item.icon}
                            </View>
                            <Text style={[
                                styles.menuLabel,
                                activeRouteName === item.name && styles.activeMenuLabel
                            ]}>
                                {item.label}
                            </Text>
                            {activeRouteName === item.name && <View style={styles.activeIndicator} />}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Compliance Banner */}
                <View style={styles.complianceCard}>
                    <ShieldCheck size={20} color={Colors.primary} />
                    <View style={styles.complianceText}>
                        <Text style={styles.complianceTitle}>Verified Partner</Text>
                        <Text style={styles.complianceSubtitle}>Documents are up-to-date</Text>
                    </View>
                </View>
            </DrawerContentScrollView>

            {/* Bottom Section */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <LogOut size={20} color={Colors.error} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        padding: Spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingTop: 40,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.backgroundLighter,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.border,
    },
    statusBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: Colors.primary,
        borderWidth: 2,
        borderColor: Colors.background,
    },
    driverInfo: {
        marginLeft: Spacing.md,
        flex: 1,
    },
    driverName: {
        color: Colors.white,
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    ratingText: {
        color: Colors.textSecondary,
        fontSize: 12,
        marginLeft: 4,
    },
    statusText: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    drawerContent: {
        paddingTop: 10,
    },
    menuContainer: {
        paddingHorizontal: Spacing.md,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: Spacing.md,
        borderRadius: 16,
        marginBottom: 8,
    },
    activeMenuItem: {
        backgroundColor: 'rgba(29, 185, 84, 0.1)',
    },
    menuIconContainer: {
        width: 30,
        alignItems: 'center',
    },
    menuLabel: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        marginLeft: Spacing.md,
        fontWeight: '500',
    },
    activeMenuLabel: {
        color: Colors.primary,
        fontWeight: '700',
    },
    activeIndicator: {
        position: 'absolute',
        right: 12,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.primary,
    },
    complianceCard: {
        margin: Spacing.xl,
        backgroundColor: Colors.backgroundLight,
        padding: Spacing.md,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    complianceText: {
        marginLeft: Spacing.md,
    },
    complianceTitle: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    complianceSubtitle: {
        color: Colors.textTertiary,
        fontSize: 10,
        marginTop: 2,
    },
    footer: {
        padding: Spacing.xl,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoutText: {
        color: Colors.error,
        fontSize: FontSizes.md,
        fontWeight: 'bold',
    },
});

export default CustomDrawerContent;
