import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Image as RNImage } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import driverApiService from '../../services/driverApiService';
import {
    Car, Tag, Calendar, Layout, Camera, ArrowRight,
    CheckCircle, ChevronLeft, Info, Check, User
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'VehicleInfo'>;

const VehicleInfoScreen = () => {
    const { user, setAuth } = useAuthStore();
    const navigation = useNavigation<NavigationProp>();

    const [make, setMake] = useState(user?.carMake || '');
    const [model, setModel] = useState(user?.carModel || '');
    const [year, setYear] = useState(user?.carYear || '');
    const [plate, setPlate] = useState(user?.plateNumber || '');
    const [color, setColor] = useState('');
    const [taxiNumber, setTaxiNumber] = useState('');
    const [isTaxi, setIsTaxi] = useState(false);
    const [carImageUrl, setCarImageUrl] = useState(user?.carImageUrl || null);
    const [logbookUrl, setLogbookUrl] = useState(user?.carRegistrationUrl || null);

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    const [showTooltip, setShowTooltip] = useState(true);

    const pickImage = async (field: 'carImageUrl' | 'carRegistrationUrl') => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0].uri, field);
        }
    };

    const uploadImage = async (uri: string, field: string) => {
        setUploading(field);
        try {
            const formData = new FormData();
            formData.append('image', {
                uri,
                name: `${field}.jpg`,
                type: 'image/jpeg',
            } as any);

            const response = await driverApiService.uploadImage(formData);

            if (response.data.success) {
                const url = response.data.imageUrl;
                if (field === 'carImageUrl') setCarImageUrl(url);
                else setLogbookUrl(url);

                await driverApiService.updateProfile({ [field]: url });
            }
        } catch (error) {
            Alert.alert('Upload Failed', 'Failed to upload vehicle image');
        } finally {
            setUploading(null);
        }
    };

    const handleSubmit = async () => {
        if (!make || !model || !year || !plate || !carImageUrl) {
            Alert.alert('Error', 'Please provide all required vehicle details and photos');
            return;
        }

        setLoading(true);
        try {
            const response = await driverApiService.submitRegistration({
                carMake: make,
                carModel: model,
                carYear: year,
                plateNumber: plate,
                color,
                taxiNumber: isTaxi ? taxiNumber : null,
                carImageUrl,
                carRegistrationUrl: logbookUrl
            });

            if (response.data.success) {
                const currentToken = useAuthStore.getState().token;
                await setAuth(response.data.data, currentToken!);
                navigation.navigate('StatusPending');
            }
        } catch (error: any) {
            console.error('Submit registration error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to submit registration');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.topNav}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={28} color="#1A1A1A" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('StatusPending')}>
                    <Text style={styles.skipText}>SKIP</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>Add Vehicle</Text>
                        <Text style={styles.stepIndicator}>5/7</Text>
                    </View>
                    <Text style={styles.subtitle}>Enter your Vehicle Details</Text>
                </View>

                <View style={styles.photoContainer}>
                    <TouchableOpacity style={styles.avatarContainer} onPress={() => pickImage('carImageUrl')}>
                        {carImageUrl ? (
                            <RNImage source={{ uri: carImageUrl }} style={styles.avatarImg} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <User size={32} color="#666" />
                            </View>
                        )}
                        <View style={styles.cameraIconBadge}>
                            <Camera size={16} color="#666" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                    <TouchableOpacity onPress={() => setShowTooltip(!showTooltip)} style={{ padding: 4 }}>
                        <Info size={20} color="#007AFF" />
                    </TouchableOpacity>

                    {showTooltip && (
                        <View style={styles.tooltip}>
                            <View style={styles.tooltipArrow} />
                            <Text style={styles.tooltipText}>
                                Vehicle image must be a front photo with number plate displayed.
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Brand (Auto Suggestion)</Text>
                        <View style={styles.dropdownContainer}>
                            <TextInput style={styles.input} placeholder="Select Brand" value={make} onChangeText={setMake} />
                            <ChevronLeft size={20} color="#666" style={{ transform: [{ rotate: '-90deg' }] }} />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Model (Auto suggestion) *</Text>
                        <View style={styles.dropdownContainer}>
                            <TextInput style={styles.input} placeholder="Select Model" value={model} onChangeText={setModel} />
                            <ChevronLeft size={20} color="#666" style={{ transform: [{ rotate: '-90deg' }] }} />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Year of Manufactured *</Text>
                        <TextInput style={styles.input} placeholder="e.g. 2023" value={year} onChangeText={setYear} keyboardType="number-pad" />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Number plate *</Text>
                        <TextInput style={styles.input} placeholder="KDV 134Z" value={plate} onChangeText={setPlate} autoCapitalize="characters" />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Color *</Text>
                        <TextInput style={styles.input} placeholder="e.g. White" value={color} onChangeText={setColor} />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Taxi Number</Text>
                        <View style={styles.taxiRow}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Enter Taxi Number"
                                value={taxiNumber}
                                onChangeText={setTaxiNumber}
                                editable={isTaxi}
                            />
                            <TouchableOpacity
                                style={[styles.checkbox, isTaxi && styles.checkboxActive]}
                                onPress={() => setIsTaxi(!isTaxi)}
                            >
                                {isTaxi && <Check size={16} color="#fff" />}
                            </TouchableOpacity>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : (
                            <Text style={styles.submitText}>CONTINUE</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContainer: { padding: 24, paddingBottom: 40 },
    topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Platform.OS === 'ios' ? 0 : 20 },
    backButton: { padding: 4, marginLeft: -4 },
    skipText: { fontSize: 16, fontWeight: '800', color: '#007AFF' },
    header: { marginTop: 24, marginBottom: 24 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 32, fontWeight: '800', color: '#334155', letterSpacing: -0.5 },
    stepIndicator: { fontSize: 32, fontWeight: '400', color: '#64748B' },
    subtitle: { fontSize: 16, color: '#64748B', marginTop: 8, fontWeight: '500' },
    photoContainer: { alignItems: 'center', marginBottom: 32, zIndex: 10 },
    avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', position: 'relative' },
    avatarImg: { width: 80, height: 80, borderRadius: 40 },
    avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    cameraIconBadge: { position: 'absolute', top: 4, right: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    addPhotoText: { fontSize: 14, color: '#94A3B8', marginTop: 8, marginBottom: 4 },
    tooltip: { position: 'absolute', top: 110, width: '90%', backgroundColor: '#fff', padding: 16, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, borderWidth: 1, borderColor: '#E2E8F0' },
    tooltipArrow: { position: 'absolute', top: -10, left: '50%', marginLeft: -10, width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#fff' },
    tooltipText: { fontSize: 14, color: '#1E293B', textAlign: 'center', lineHeight: 20 },
    form: { gap: 20 },
    inputGroup: { gap: 8 },
    label: { fontSize: 16, fontWeight: '500', color: '#334155' },
    dropdownContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingRight: 16 },
    input: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, height: 56, fontSize: 16, color: '#1E293B' },
    taxiRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    checkbox: { width: 28, height: 28, borderRadius: 4, borderWidth: 2, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
    checkboxActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
    submitBtn: { height: 64, backgroundColor: '#4A1D24', borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
    submitText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
});

export default VehicleInfoScreen;
