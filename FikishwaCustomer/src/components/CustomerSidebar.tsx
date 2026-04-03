import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Animated, Platform } from 'react-native';
import { Home, Clock, User, Shield, HelpCircle, LogOut, X } from 'lucide-react-native';

interface CustomerSidebarProps {
    visible: boolean;
    user: any;
    colors: any;
    onClose: () => void;
    onNavigation: (screen: string) => void;
    onLogout: () => void;
}

const CustomerSidebar = ({
    visible,
    user,
    colors,
    onClose,
    onNavigation,
    onLogout,
}: CustomerSidebarProps) => {
    if (!visible) return null;

    return (
        <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={onClose}
        >
            <Animated.View style={[styles.sidebar, { backgroundColor: colors.backgroundCard }]}>
                <SafeAreaView style={styles.container}>
                    {/* Sidebar Header */}
                    <View style={[styles.header, { backgroundColor: colors.primary }]}>
                        <View style={styles.headerTop}>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.userInfo}>
                            <View style={styles.avatarPlaceholder}>
                                <User size={30} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.userName}>{user?.name || 'Customer'}</Text>
                                <Text style={styles.userEmail}>{user?.email || ''}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Sidebar Content */}
                    <ScrollView style={styles.content}>
                        <TouchableOpacity
                            style={styles.item}
                            onPress={() => { onClose(); onNavigation('Home'); }}
                        >
                            <Home size={22} color={colors.primary} />
                            <Text style={[styles.itemText, { color: colors.textPrimary }]}>Home</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.item}
                            onPress={() => { onClose(); onNavigation('RideHistory'); }}
                        >
                            <Clock size={22} color={colors.primary} />
                            <Text style={[styles.itemText, { color: colors.textPrimary }]}>My Rides</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.item}
                            onPress={() => { onClose(); onNavigation('Profile'); }}
                        >
                            <User size={22} color={colors.primary} />
                            <Text style={[styles.itemText, { color: colors.textPrimary }]}>Profile</Text>
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        <TouchableOpacity style={styles.item}>
                            <Shield size={22} color={colors.textSecondary} />
                            <Text style={[styles.itemText, { color: colors.textPrimary }]}>Safety</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.item}>
                            <HelpCircle size={22} color={colors.textSecondary} />
                            <Text style={[styles.itemText, { color: colors.textPrimary }]}>Support</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Sidebar Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={onLogout}
                        >
                            <LogOut size={20} color={colors.error} />
                            <Text style={[styles.logoutText, { color: colors.error }]}>Sign Out</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
    },
    sidebar: {
        width: '80%',
        height: '100%',
        elevation: 16,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    container: {
        flex: 1,
    },
    header: {
        padding: 24,
        paddingTop: 40,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 16,
    },
    closeButton: {
        padding: 4,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
    },
    userEmail: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 16,
    },
    itemText: {
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginVertical: 16,
    },
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 32,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '700',
    },
});

export default CustomerSidebar;
