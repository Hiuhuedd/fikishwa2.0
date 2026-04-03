import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Image as RNImage, Modal, FlatList } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import driverApiService from '../../services/driverApiService';
import { CAR_BRANDS_AND_MODELS, CAR_BRANDS } from '../../constants/vehicles';
import {
    Car, Tag, Calendar, Layout, Camera, ArrowRight,
    CheckCircle, ChevronLeft, Info, Check, User, X, Search
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
    const [profilePhotoUrl, setProfilePhotoUrl] = useState((user as any)?.profilePhotoUrl || null);

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    const [showTooltip, setShowTooltip] = useState(true);

    const [showMakeModal, setShowMakeModal] = useState(false);
    const [makeSearch, setMakeSearch] = useState('');
    const [showModelModal, setShowModelModal] = useState(false);
    const [modelSearch, setModelSearch] = useState('');

    const popularBrands = [
        'Toyota', 'Nissan', 'Mazda', 'Honda', 'Isuzu', 'Mitsubishi',
        'Subaru', 'Suzuki', 'Mercedes-Benz', 'BMW', 'Volkswagen',
        'Ford', 'Hyundai', 'Kia', 'Land Rover', 'Audi', 'Lexus',
        'Peugeot', 'Chevrolet', 'Hino', 'Scania'
    ].sort();

    const filteredMakes = makeSearch
        ? popularBrands.filter(b => b.toLowerCase().includes(makeSearch.toLowerCase()))
        : popularBrands;

    const availableModels = CAR_BRANDS_AND_MODELS[make] || [];
    const filteredModels = model ? availableModels.filter(m => m.toLowerCase().includes(model.toLowerCase())) : availableModels;

    const pickImage = async (field: 'profilePhotoUrl') => {
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
                if (field === 'profilePhotoUrl') setProfilePhotoUrl(url);

                await driverApiService.updateProfile({ [field]: url });
            }
        } catch (error) {
            Alert.alert('Upload Failed', 'Failed to upload profile photo');
        } finally {
            setUploading(null);
        }
    };

    const handleSubmit = async () => {
        if (!make || !model || !year || !plate || !profilePhotoUrl) {
            Alert.alert('Error', 'Please provide all required vehicle details and a profile photo');
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
                profilePhotoUrl
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

            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('DocumentUpload')} style={styles.backButton}>
                            <ChevronLeft size={28} color="#1A1A1A" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Add Vehicle</Text>
                        <Text style={styles.stepIndicator}>4/4</Text>
                    </View>
                    <Text style={styles.subtitle}>Enter your Vehicle Details</Text>
                </View>

                <View style={styles.photoContainer}>
                    <TouchableOpacity style={styles.avatarContainer} onPress={() => pickImage('profilePhotoUrl')}>
                        {profilePhotoUrl ? (
                            <RNImage source={{ uri: profilePhotoUrl }} style={styles.avatarImg} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { borderColor: '#E5E7EB' }]}>
                                <User size={32} color="#94A3B8" />
                            </View>
                        )}
                        <View style={styles.cameraIconBadge}>
                            <Camera size={16} color="#001C3D" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.addPhotoText}>Add Profile Photo</Text>
                    <TouchableOpacity onPress={() => setShowTooltip(!showTooltip)} style={{ padding: 4 }}>
                        <Info size={20} color="#001C3D" />
                    </TouchableOpacity>

                    {showTooltip && (
                        <View style={styles.tooltip}>
                            <View style={styles.tooltipArrow} />
                            <Text style={styles.tooltipText}>
                                Please provide a clear profile photo for your driver account.
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Vehicle Brand *</Text>
                        <TouchableOpacity
                            style={styles.dropdownContainer}
                            onPress={() => {
                                setMakeSearch('');
                                setShowMakeModal(true);
                            }}
                        >
                            <View style={styles.inputReplacement}>
                                <Car size={20} color="#94A3B8" style={{ marginRight: 12 }} />
                                <Text style={[styles.inputText, !make && { color: '#94A3B8' }]}>
                                    {make || 'Select Vehicle Brand'}
                                </Text>
                            </View>
                            <ChevronLeft size={20} color="#94A3B8" style={{ transform: [{ rotate: '-90deg' }] }} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Vehicle Model *</Text>
                        <TouchableOpacity
                            style={styles.dropdownContainer}
                            onPress={() => {
                                setModelSearch('');
                                setShowModelModal(true);
                            }}
                            disabled={!make}
                        >
                            <View style={styles.inputReplacement}>
                                <Car size={20} color="#94A3B8" style={{ marginRight: 12 }} />
                                <Text style={[styles.inputText, !model && { color: '#94A3B8' }]}>
                                    {model || 'Select Vehicle Model'}
                                </Text>
                            </View>
                            <ChevronLeft size={20} color="#94A3B8" style={{ transform: [{ rotate: '-90deg' }] }} />
                        </TouchableOpacity>
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
                            <>
                                <Text style={styles.submitText}>CONTINUE</Text>
                                <ArrowRight size={20} color="#fff" style={{ marginLeft: 8 }} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Brand Selection Modal */}
            <Modal
                visible={showMakeModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowMakeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderBar} />
                            <View style={styles.modalTitleRow}>
                                <Text style={styles.modalTitle}>Select Vehicle Brand</Text>
                                <TouchableOpacity onPress={() => setShowMakeModal(false)}>
                                    <View style={styles.closeModalButton}>
                                        <X size={20} color="#666" />
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.searchContainer}>
                                <Search size={20} color="#94A3B8" />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search brands..."
                                    value={makeSearch}
                                    onChangeText={setMakeSearch}
                                    placeholderTextColor="#94A3B8"
                                    autoFocus
                                />
                            </View>
                        </View>

                        <FlatList
                            data={filteredMakes}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setMake(item);
                                        setShowMakeModal(false);
                                        setModel('');
                                    }}
                                >
                                    <Text style={[styles.modalItemText, make === item && styles.modalItemSelectedText]}>
                                        {item}
                                    </Text>
                                    {make === item && <Check size={20} color="#001C3D" />}
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={{ paddingBottom: 40 }}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>
            </Modal>

            {/* Model Selection Modal */}
            <Modal
                visible={showModelModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowModelModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderBar} />
                            <View style={styles.modalTitleRow}>
                                <Text style={styles.modalTitle}>Select Vehicle Model</Text>
                                <TouchableOpacity onPress={() => setShowModelModal(false)}>
                                    <View style={styles.closeModalButton}>
                                        <X size={20} color="#666" />
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.searchContainer}>
                                <Search size={20} color="#94A3B8" />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search models..."
                                    value={modelSearch}
                                    onChangeText={setModelSearch}
                                    placeholderTextColor="#94A3B8"
                                    autoFocus
                                />
                            </View>
                        </View>

                        <FlatList
                            data={modelSearch ? availableModels.filter(m => m.toLowerCase().includes(modelSearch.toLowerCase())) : availableModels}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setModel(item);
                                        setShowModelModal(false);
                                    }}
                                >
                                    <Text style={[styles.modalItemText, model === item && styles.modalItemSelectedText]}>
                                        {item}
                                    </Text>
                                    {model === item && <Check size={20} color="#001C3D" />}
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={{ paddingBottom: 40 }}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContainer: { padding: 24, paddingBottom: 40 },
    topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Platform.OS === 'ios' ? 0 : 20 },
    header: {
        marginTop: 24,
        marginBottom: 24,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    backButton: {
        marginLeft: -12,
        marginRight: 4,
        padding: 4,
    },
    title: {
        flex: 1,
        fontSize: 28,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    stepIndicator: {
        fontSize: 18,
        fontWeight: '600',
        color: '#64748B',
    },
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
    suggestionsContainer: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, overflow: 'hidden' },
    suggestionItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    suggestionText: { fontSize: 16, color: '#334155' },
    taxiRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    checkbox: { width: 28, height: 28, borderRadius: 4, borderWidth: 2, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
    checkboxActive: { backgroundColor: '#001C3D', borderColor: '#001C3D' },
    submitBtn: { height: 56, backgroundColor: '#001C3D', borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12 },
    submitText: { color: '#fff', fontSize: 18, fontWeight: '600' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%', paddingHorizontal: 24 },
    modalHeader: { paddingVertical: 16 },
    modalHeaderBar: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    modalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
    closeModalButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 16, height: 50 },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: '#1E293B' },
    modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalItemText: { fontSize: 16, color: '#475569', fontWeight: '500' },
    modalItemSelectedText: { color: '#001C3D', fontWeight: '800' },
    inputReplacement: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 56, paddingHorizontal: 16 },
    inputText: { fontSize: 16, color: '#1E293B' },
});

export default VehicleInfoScreen;
