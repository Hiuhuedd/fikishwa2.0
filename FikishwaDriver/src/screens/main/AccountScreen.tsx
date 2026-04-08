import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Image as RNImage, ActivityIndicator, Alert } from 'react-native';
import { ChevronLeft, User, Phone, Mail, MapPin, ChevronRight, Camera, Check, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import * as ImagePicker from 'expo-image-picker';
import driverApiService from '../../services/driverApiService';
import { colors } from '../../theme/colors';

const MenuItem = ({ icon: Icon, title, value, field, placeholder, isEditing, formData, setFormData, showChevron = true }: any) => (
    <View style={styles.menuItem}>
        <View style={styles.menuItemLeft}>
            <View style={styles.iconContainer}>
                <Icon size={20} color="#64748B" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.menuItemTitle}>{title}</Text>
                {isEditing && field ? (
                    <TextInput
                        style={styles.input}
                        value={formData[field]}
                        onChangeText={(text) => setFormData((prev: any) => ({ ...prev, [field]: text }))}
                        placeholder={placeholder}
                        autoCapitalize={field === 'email' ? 'none' : 'words'}
                        keyboardType={field === 'phone' ? 'phone-pad' : (field === 'email' ? 'email-address' : 'default')}
                    />
                ) : (
                    <Text style={styles.menuItemValue}>{value || 'Not provided'}</Text>
                )}
            </View>
        </View>
        {!isEditing && showChevron && <ChevronRight size={20} color="#CBD5E1" />}
    </View>
);

const AccountScreen = () => {
    const navigation = useNavigation();
    const { user, updateUser } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        profilePhotoUrl: user?.profilePhotoUrl || ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                profilePhotoUrl: user.profilePhotoUrl || ''
            });
        }
    }, [user]);

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setIsLoading(true);
            try {
                const uri = result.assets[0].uri;
                const fileName = uri.split('/').pop() || 'profile.jpg';
                const match = /\.(\w+)$/.exec(fileName);
                const type = match ? `image/${match[1]}` : `image`;

                const formDataImage = new FormData();
                formDataImage.append('image', {
                    uri,
                    name: fileName,
                    type,
                } as any);

                const uploadRes = await driverApiService.uploadImage(formDataImage);
                if (uploadRes.data.success) {
                    setFormData(prev => ({ ...prev, profilePhotoUrl: uploadRes.data.imageUrl }));
                }
            } catch (error) {
                console.error('Image Upload Error:', error);
                Alert.alert('Error', 'Failed to upload image');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const response = await driverApiService.updateProfile(formData);
            if (response.data.success) {
                await updateUser(response.data.data);
                setIsEditing(false);
                Alert.alert('Success', 'Profile updated successfully');
            }
        } catch (error: any) {
            console.error('Update Profile Error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={28} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Account</Text>
                {isEditing ? (
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity onPress={() => setIsEditing(false)} disabled={isLoading}>
                            <X size={24} color="#64748B" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSave} disabled={isLoading}>
                            {isLoading ? <ActivityIndicator size="small" color="#001C3D" /> : <Check size={24} color="#22C55E" />}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity onPress={() => setIsEditing(true)}>
                        <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileSection}>
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        onPress={handlePickImage}
                        disabled={!isEditing || isLoading}
                    >
                        {formData.profilePhotoUrl ? (
                            <RNImage source={{ uri: formData.profilePhotoUrl }} style={styles.avatarLarge} />
                        ) : (
                            <View style={[styles.avatarLarge, { backgroundColor: '#001C3D' }]}>
                                <User size={48} color="#fff" />
                            </View>
                        )}
                        {isEditing && (
                            <View style={styles.editIconContainer}>
                                <Camera size={16} color="#fff" />
                            </View>
                        )}
                        {isLoading && isEditing && (
                            <View style={styles.imageLoadingOverlay}>
                                <ActivityIndicator color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.profileName}>{user?.name || 'Driver Name'}</Text>
                    <Text style={styles.profileHandle}>Approved Driver</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <MenuItem
                        icon={User}
                        title="Name"
                        value={formData.name}
                        field="name"
                        placeholder="Enter Full Name"
                        isEditing={isEditing}
                        formData={formData}
                        setFormData={setFormData}
                    />
                    <MenuItem
                        icon={Phone}
                        title="Phone Number"
                        value={formData.phone}
                        field="phone"
                        placeholder="Enter Phone Number"
                        isEditing={isEditing}
                        formData={formData}
                        setFormData={setFormData}
                    />
                    <MenuItem
                        icon={Mail}
                        title="Email Address"
                        value={formData.email}
                        field="email"
                        placeholder="Enter Email Address"
                        isEditing={isEditing}
                        formData={formData}
                        setFormData={setFormData}
                    />
                    <MenuItem
                        icon={MapPin}
                        title="Total Rides"
                        value={`${user?.totalRides || 0} Rides`}
                        showChevron={false}
                        isEditing={isEditing}
                        formData={formData}
                        setFormData={setFormData}
                    />
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backButton: { padding: 4, marginRight: 16 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
    scrollContent: { padding: 20 },
    profileSection: { alignItems: 'center', marginBottom: 32 },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    avatarLarge: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center' },
    editIconContainer: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#001C3D', width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    imageLoadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 48, justifyContent: 'center', alignItems: 'center' },
    profileName: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
    profileHandle: { fontSize: 16, color: '#64748B', marginTop: 4 },
    editBtnText: { color: '#001C3D', fontSize: 16, fontWeight: '700' },
    section: { backgroundColor: '#fff', borderRadius: 20, padding: 8, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 15 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 12, marginBottom: 8, marginTop: 12 },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
    iconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    menuItemTitle: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
    menuItemValue: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginTop: 2 },
    input: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginTop: 2, padding: 0 },
    deleteBtn: { marginTop: 8, alignItems: 'center', padding: 16 },
    deleteText: { color: '#EF4444', fontSize: 16, fontWeight: '600' }
});

export default AccountScreen;
