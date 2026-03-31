import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, TextInput } from 'react-native';
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
        logbookUrl: user?.carRegistrationUrl || null,
        carImageUrl: user?.carImageUrl || null,
    });
    const [uploading, setUploading] = useState<string | null>(null);

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

    const handleNext = () => {
        if (!docs.insuranceUrl || !docs.inspectionUrl || !docs.logbookUrl || !docs.carImageUrl) {
            Alert.alert('Missing Documents', 'Please upload all required documents to proceed');
            return;
        }
        navigation.navigate('VehicleInfo');
    };

    const DocumentItem = ({ index, title, field, value, expiryField, expiryValue }: { index: number, title: string, field: keyof typeof docs, value: string | null, expiryField?: keyof typeof docs, expiryValue?: string }) => (
        <View style={styles.docItem}>
            <View style={styles.docMain}>
                <View style={[styles.numberCircle, value && styles.numberCircleCompleted]}>
                    <Text style={[styles.numberText, value && styles.numberTextCompleted]}>{index}</Text>
                </View>
                <View style={styles.docInfo}>
                    <Text style={styles.docTitle}>{title}</Text>
                    <TouchableOpacity>
                        <Text style={styles.knowMore}>Know more</Text>
                    </TouchableOpacity>
                    {expiryField && (
                        <View style={styles.expiryRow}>
                            <Text style={styles.expireLabel}>Expire on* :</Text>
                            <TouchableOpacity style={styles.datePicker}>
                                <TextInput
                                    style={styles.dateInput}
                                    placeholder="DD/MM/YYYY"
                                    value={expiryValue}
                                    onChangeText={(text) => setDocs(prev => ({ ...prev, [expiryField]: text }))}
                                />
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
                    <ActivityIndicator size="small" color="#007AFF" />
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
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronLeft size={28} color="#1A1A1A" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Vehicle Documents</Text>
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
                        field="logbookUrl"
                        value={docs.logbookUrl}
                    />
                    <DocumentItem
                        index={4}
                        title="Vehicle Photo"
                        field="carImageUrl"
                        value={docs.carImageUrl}
                    />
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleNext}>
                    <Text style={styles.submitBtnText}>SUBMIT</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContainer: { padding: 24, paddingBottom: 40 },
    header: { marginTop: 20, marginBottom: 32 },
    backButton: { marginBottom: 20, marginLeft: -4 },
    title: { fontSize: 32, fontWeight: '500', color: '#4A4A4A', letterSpacing: -0.5 },
    subtitle: { fontSize: 16, color: '#9B9B9B', marginTop: 8 },
    docList: { gap: 24, marginBottom: 40 },
    docItem: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    docMain: { flexDirection: 'row', flex: 1, gap: 16 },
    numberCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center' },
    numberCircleCompleted: { backgroundColor: '#EBF5FF' },
    numberText: { fontSize: 16, fontWeight: '600', color: '#E53E3E' },
    numberTextCompleted: { color: '#3182CE' },
    docInfo: { flex: 1 },
    docTitle: { fontSize: 18, color: '#4A4A4A', fontWeight: '500' },
    knowMore: { fontSize: 14, color: '#3182CE', marginTop: 4 },
    expiryRow: { marginTop: 12 },
    expireLabel: { fontSize: 14, color: '#9B9B9B', fontWeight: '500' },
    datePicker: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
    dateInput: { fontSize: 16, color: '#4A4A4A', padding: 0 },
    uploadBtnAction: { padding: 8 },
    submitBtn: { height: 64, backgroundColor: '#AC8E92', borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginTop: 'auto' },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
});

export default DocumentUploadScreen;
