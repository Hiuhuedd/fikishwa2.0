import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, TextInput } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import driverApiService from '../../services/driverApiService';
import {
    Upload, CheckCircle, FileText, ArrowRight,
    Camera, ChevronLeft, Clock, Calendar, User
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'IdentityDocuments'>;

const IdentityDocumentScreen = () => {
    const { user, setAuth } = useAuthStore();
    const navigation = useNavigation<NavigationProp>();

    const [docs, setDocs] = useState({
        idFrontUrl: (user as any)?.idFrontUrl || null,
        idBackUrl: (user as any)?.idBackUrl || null,
        licenseUrl: (user as any)?.licenseUrl || null,
        goodConductUrl: (user as any)?.goodConductUrl || null,
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

                // Update profile on backend immediately to save progress
                await driverApiService.updateProfile({ [field]: url });

                // Update local store
                const currentToken = useAuthStore.getState().token;
                await setAuth({ ...user, [field]: url } as any, currentToken!);
            }
        } catch (error) {
            console.error('Upload Error:', error);
            Alert.alert('Upload Failed', 'There was an issue uploading your document');
        } finally {
            setUploading(null);
        }
    };

    const handleNext = () => {
        if (!docs.idFrontUrl || !docs.idBackUrl || !docs.licenseUrl) {
            Alert.alert('Missing Documents', 'ID and Driving License are required to proceed');
            return;
        }
        navigation.navigate('DocumentUpload'); // Next is vehicle docs
    };

    const DocumentItem = ({ index, title, description, field, value }: { index: number, title: string, description: string, field: keyof typeof docs, value: string | null }) => (
        <View style={styles.docItem}>
            <View style={styles.docMain}>
                <View style={[styles.numberCircle, value && styles.numberCircleCompleted]}>
                    {value ? <CheckCircle size={20} color="#3182CE" /> : <Text style={styles.numberText}>{index}</Text>}
                </View>
                <View style={styles.docInfo}>
                    <Text style={styles.docTitle}>{title}</Text>
                    <Text style={styles.docDescription}>{description}</Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.uploadBtnAction}
                onPress={() => pickDocument(field)}
                disabled={uploading === field}
            >
                {uploading === field ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                ) : value ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EBF5FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 }}>
                        <CheckCircle size={14} color="#3182CE" style={{ marginRight: 4 }} />
                        <Text style={{ color: '#3182CE', fontSize: 13, fontWeight: '600' }}>Uploaded</Text>
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
                    <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('PersonalDetails')} style={styles.backButton}>
                        <ChevronLeft size={28} color="#1A1A1A" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Identity Docs</Text>
                    <Text style={styles.subtitle}>Verify your identity and permit</Text>
                </View>

                <View style={styles.docList}>
                    <DocumentItem
                        index={1}
                        title="ID Card (Front)"
                        description="Clear photo of your national ID front"
                        field="idFrontUrl"
                        value={docs.idFrontUrl}
                    />
                    <DocumentItem
                        index={2}
                        title="ID Card (Back)"
                        description="Clear photo of your national ID back"
                        field="idBackUrl"
                        value={docs.idBackUrl}
                    />
                    <DocumentItem
                        index={3}
                        title="Driving License"
                        description="Front view of your valid license"
                        field="licenseUrl"
                        value={docs.licenseUrl}
                    />
                    <DocumentItem
                        index={4}
                        title="Good Conduct (Optional)"
                        description="Police clearance certificate"
                        field="goodConductUrl"
                        value={docs.goodConductUrl}
                    />
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleNext}>
                    <Text style={styles.submitBtnText}>CONTINUE</Text>
                    <ArrowRight size={20} color="#fff" style={{ marginLeft: 8 }} />
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
    title: { fontSize: 32, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 },
    subtitle: { fontSize: 16, color: '#666', marginTop: 8 },
    docList: { gap: 24, marginBottom: 40 },
    docItem: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    docMain: { flexDirection: 'row', flex: 1, gap: 16 },
    numberCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    numberCircleCompleted: { backgroundColor: '#EBF5FF', borderColor: '#3182CE' },
    numberText: { fontSize: 16, fontWeight: '600', color: '#64748B' },
    docInfo: { flex: 1 },
    docTitle: { fontSize: 18, color: '#1E293B', fontWeight: '700' },
    docDescription: { fontSize: 13, color: '#64748B', marginTop: 2 },
    uploadBtnAction: { padding: 8, justifyContent: 'center' },
    submitBtn: { height: 64, backgroundColor: '#007AFF', borderRadius: 32, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto' },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
});

export default IdentityDocumentScreen;
