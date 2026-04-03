import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Alert, ScrollView } from 'react-native';
import {
    User, MapPin, Clock, CreditCard, Gift,
    Settings, HelpCircle, LogOut, ChevronRight,
    ShieldCheck
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface SidebarMenuProps {
    visible: boolean;
    user: any;
    onClose: () => void;
    onLogout: () => void;
    onDashboardPress: () => void;
    onHistoryPress: () => void;
    onEarningsPress: () => void;
    onReferralPress: () => void;
    onAccountPress: () => void;
    onHelpPress: () => void;
}

const SidebarMenu = ({
    visible, user, onClose, onLogout,
    onDashboardPress, onHistoryPress, onEarningsPress,
    onReferralPress, onAccountPress, onHelpPress
}: SidebarMenuProps) => {
    if (!visible) return null;

    const MenuItem = ({ icon: Icon, title, onPress, color = '#001C3D', bgColor = '#E6F0FF' }: any) => (
        <TouchableOpacity style={styles.sidebarItem} onPress={() => { onPress(); onClose(); }}>
            <View style={[styles.sidebarIcon, { backgroundColor: bgColor }]}>
                <Icon size={20} color={color} />
            </View>
            <Text style={styles.sidebarItemText}>{title}</Text>
            <ChevronRight size={16} color="#CBD5E1" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
    );

    return (
        <>
            <TouchableOpacity style={styles.sidebarOverlay} activeOpacity={1} onPress={onClose} />
            <View style={styles.sidebar}>
                <View style={styles.sidebarHeader}>
                    <View style={styles.sidebarAvatar}>
                        {user?.carImageUrl ? (
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Profile</Text>
                        ) : (
                            <User size={32} color="#fff" />
                        )}
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.sidebarName} numberOfLines={1}>{user?.name || 'Driver'}</Text>
                        <View style={styles.statusBadge}>
                            <View style={styles.statusDot} />
                            <Text style={styles.sidebarPhone}>Online</Text>
                        </View>
                    </View>
                </View>

                <ScrollView style={styles.sidebarContent} showsVerticalScrollIndicator={false}>
                    <MenuItem icon={MapPin} title="Dashboard" onPress={onDashboardPress} color="#001C3D" bgColor="#E6F0FF" />
                    <MenuItem icon={Clock} title="My Rides" onPress={onHistoryPress} color="#8B5CF6" bgColor="#F5F3FF" />
                    <MenuItem icon={CreditCard} title="Earnings" onPress={onEarningsPress} color="#10B981" bgColor="#ECFDF5" />
                    <MenuItem icon={Gift} title="Referrals" onPress={onReferralPress} color="#F59E0B" bgColor="#FFFBEB" />
                    <MenuItem icon={ShieldCheck} title="Safety Toolkit" onPress={() => Alert.alert('Safety', 'Safety features coming soon')} color="#EF4444" bgColor="#FEF2F2" />

                    <View style={styles.divider} />

                    <MenuItem icon={User} title="My Account" onPress={onAccountPress} color="#64748B" bgColor="#F1F5F9" />
                    <MenuItem icon={HelpCircle} title="Help & Support" onPress={onHelpPress} color="#64748B" bgColor="#F1F5F9" />

                    {/* Add extra space at bottom of scroll to ensure last item is fully visible */}
                    <View style={{ height: 20 }} />
                </ScrollView>

                <TouchableOpacity style={styles.sidebarFooter} onPress={onLogout}>
                    <LogOut size={20} color="#FF3B30" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    sidebarOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 },
    sidebar: { position: 'absolute', top: 0, left: 0, bottom: 0, width: width * 0.8, backgroundColor: '#fff', zIndex: 1001, paddingTop: Platform.OS === 'ios' ? 50 : 30 },
    sidebarHeader: { padding: 24, backgroundColor: '#001C3D', flexDirection: 'row', alignItems: 'center', gap: 16 },
    sidebarAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
    headerInfo: { flex: 1 },
    sidebarName: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
    sidebarPhone: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
    sidebarContent: { flex: 1, paddingHorizontal: 16 },
    sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, gap: 16, borderRadius: 12, marginBottom: 4 },
    sidebarIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    sidebarItemText: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16, marginHorizontal: 8 },
    sidebarFooter: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 52, // More padding for both platforms
        borderTopWidth: 1,
        borderTopColor: '#F2F2F7',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    logoutText: { fontSize: 16, fontWeight: '700', color: '#FF3B30' },
});

export default SidebarMenu;
