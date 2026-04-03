import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { ChevronLeft, User, Phone, Mail, MapPin, Shield, Bell, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';

const AccountScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuthStore();

    const MenuItem = ({ icon: Icon, title, value, onPress, showChevron = true }: any) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                    <Icon size={20} color="#64748B" />
                </View>
                <View>
                    <Text style={styles.menuItemTitle}>{title}</Text>
                    {value && <Text style={styles.menuItemValue}>{value}</Text>}
                </View>
            </View>
            {showChevron && <ChevronRight size={20} color="#CBD5E1" />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={28} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Account</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileSection}>
                    <View style={styles.avatarLarge}>
                        <User size={48} color="#fff" />
                    </View>
                    <Text style={styles.profileName}>{user?.name || 'Driver Name'}</Text>
                    <Text style={styles.profileHandle}>Approved Driver</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <MenuItem icon={User} title="Name" value={user?.name} />
                    <MenuItem icon={Phone} title="Phone Number" value={user?.phone} />
                    <MenuItem icon={Mail} title="Email Address" value={user?.email || 'Not provided'} />
                    <MenuItem icon={MapPin} title="Total Rides" value="450 Rides" showChevron={false} />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security & Settings</Text>
                    <MenuItem icon={Shield} title="Privacy Policy" />
                    <MenuItem icon={Bell} title="Notifications" />
                </View>

                <TouchableOpacity style={styles.deleteBtn}>
                    <Text style={styles.deleteText}>Delete Account</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' },
    backButton: { padding: 4, marginRight: 16 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
    scrollContent: { padding: 20 },
    profileSection: { alignItems: 'center', marginBottom: 32 },
    avatarLarge: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#001C3D', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    profileName: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
    profileHandle: { fontSize: 16, color: '#64748B', marginTop: 4 },
    section: { backgroundColor: '#fff', borderRadius: 20, padding: 8, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 15 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 12, marginBottom: 8, marginTop: 12 },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    iconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    menuItemTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
    menuItemValue: { fontSize: 14, color: '#64748B', marginTop: 2 },
    deleteBtn: { marginTop: 8, alignItems: 'center', padding: 16 },
    deleteText: { color: '#EF4444', fontSize: 16, fontWeight: '600' }
});

export default AccountScreen;
