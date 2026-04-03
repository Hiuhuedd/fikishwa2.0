import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, TextInput, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import driverApiService from '../../services/driverApiService';
import {
    Upload, CheckCircle, FileText, ArrowRight,
    Camera, ChevronLeft, Clock, Calendar
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'DocumentUpload'>;

const DocumentUploadScreen = () => {
    const { user, setAuth } = useAuthStore();
    const navigation = useNavigation<NavigationProp>();

    const [docs, setDocs] = useState({
        insuranceUrl: (user as any)?.insuranceUrl || null,
        insuranceExpiry: '',
        inspectionUrl: (user as any)?.inspectionUrl || null,
        inspectionExpiry: '',
        carRegistrationUrl: user?.carRegistrationUrl || null,
        carImageUrl: user?.carImageUrl || null,
    });
    const [uploading, setUploading] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState<keyof typeof docs | null>(null);

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(null);
        }
        if (selectedDate && showDatePicker) {
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const year = selectedDate.getFullYear();
            const formattedDate = `${day}/${month}/${year}`;
            setDocs(prev => ({ ...prev, [showDatePicker]: formattedDate }));
        }
        if (Platform.OS === 'ios' && event.type === 'set') {
            setShowDatePicker(null);
        }
    };

    const pickDocument = async (field: keyof typeof docs) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'We need access to your gallery to upload documents');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            uploadToBackend(result.assets[0].uri, field);
        }
    };

    const uploadToBackend = async (uri: string, field: string) => {
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
                setDocs(prev => ({ ...prev, [field]: url }));

                // Update profile on backend
                await driverApiService.updateProfile({ [field]: url });
            }
        } catch (error) {
            console.error('Upload Error:', error);
            Alert.alert('Upload Failed', 'There was an issue uploading your document');
        } finally {
            setUploading(null);
        }
    };

    const handleNext = async () => {
        if (!docs.insuranceUrl || !docs.inspectionUrl || !docs.carRegistrationUrl || !docs.carImageUrl) {
            Alert.alert('Missing Documents', 'Please upload all required documents to proceed');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            navigation.navigate('VehicleInfo');
        }, 800);
    };

    const DocumentItem = ({ index, title, field, value, expiryField, expiryValue }: { index: number, title: string, field: keyof typeof docs, value: string | null, expiryField?: keyof typeof docs, expiryValue?: string }) => (
        <View style={styles.docItem}>
            <View style={styles.docMain}>
                <View style={[styles.numberCircle, value && styles.numberCircleCompleted]}>
                    {value ? <CheckCircle size={20} color="#001C3D" /> : <Text style={[styles.numberText, value && styles.numberTextCompleted]}>{index}</Text>}
                </View>
                <View style={styles.docInfo}>
                    <Text style={styles.docTitle}>{title}</Text>

                    {expiryField && (
                        <View style={styles.expiryRow}>
                            <Text style={styles.expireLabel}>Expire on* :</Text>
                            <TouchableOpacity style={styles.datePicker} onPress={() => setShowDatePicker(expiryField as keyof typeof docs)}>
                                <Text style={[styles.dateInput, !expiryValue && { color: '#9B9B9B' }]}>
                                    {expiryValue || "DD/MM/YYYY"}
                                </Text>
                                <Calendar size={18} color="#666" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
            <TouchableOpacity
                style={styles.uploadBtnAction}
                onPress={() => pickDocument(field)}
                disabled={uploading === field}
            >
                {uploading === field ? (
                    <ActivityIndicator size="small" color="#001C3D" />
                ) : value ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6F0FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 }}>
                        <CheckCircle size={14} color="#001C3D" style={{ marginRight: 4 }} />
                        <Text style={{ color: '#001C3D', fontSize: 13, fontWeight: '600' }}>Uploaded</Text>
                    </View>
                ) : (
                    <Upload size={24} color="#1A1A1A" />
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: '#fff' }]}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('IdentityDocuments')} style={styles.backButton}>
                            <ChevronLeft size={28} color="#1A1A1A" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Vehicle Documents</Text>
                        <Text style={styles.stepIndicator}>3/4</Text>
                    </View>
                    <Text style={styles.subtitle}>For verification, Upload your Vehicle documents</Text>
                </View>

                <View style={styles.docList}>
                    <DocumentItem
                        index={1}
                        title="Insurance"
                        field="insuranceUrl"
                        value={docs.insuranceUrl}
                        expiryField="insuranceExpiry"
                        expiryValue={docs.insuranceExpiry}
                    />
                    <DocumentItem
                        index={2}
                        title="Inspection Certificate"
                        field="inspectionUrl"
                        value={docs.inspectionUrl}
                        expiryField="inspectionExpiry"
                        expiryValue={docs.inspectionExpiry}
                    />
                    <DocumentItem
                        index={3}
                        title="Log Book or Sale Agreement"
                        field="carRegistrationUrl"
                        value={docs.carRegistrationUrl}
                    />
                    <DocumentItem
                        index={4}
                        title="Vehicle Photo"
                        field="carImageUrl"
                        value={docs.carImageUrl}
                    />
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleNext} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.submitBtnText}>CONTINUE</Text>
                            <ArrowRight size={20} color="#fff" style={{ marginLeft: 8 }} />
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>

            {showDatePicker && (
                <DateTimePicker
                    value={docs[showDatePicker] ? new Date(docs[showDatePicker].split('/').reverse().join('-')) : new Date()}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    minimumDate={new Date()}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContainer: { padding: 24, paddingBottom: 40 },
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
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    docList: { gap: 24, marginBottom: 40 },
    docItem: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    docMain: { flexDirection: 'row', flex: 1, gap: 16 },
    numberCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    numberCircleCompleted: { backgroundColor: '#E6F0FF' },
    numberText: { fontSize: 16, fontWeight: '600', color: '#64748B' },
    numberTextCompleted: { color: '#001C3D' },
    docInfo: { flex: 1 },
    docTitle: { fontSize: 18, color: '#1E293B', fontWeight: '700' },
    knowMore: { fontSize: 14, color: '#001C3D', marginTop: 4 },
    expiryRow: { marginTop: 12 },
    expireLabel: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },
    datePicker: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
    dateInput: { fontSize: 16, color: '#1E293B', padding: 0 },
    uploadBtnAction: { padding: 8 },
    submitBtn: { height: 56, backgroundColor: '#001C3D', borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto' },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});

export default DocumentUploadScreen;
