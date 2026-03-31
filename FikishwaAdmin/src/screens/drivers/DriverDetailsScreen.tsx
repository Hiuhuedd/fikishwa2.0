import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
    getDriverDetails,
    approveDriver,
    rejectDriver,
    toggleDriverStatus,
    updateDriverCategory,
    verifyDocument,
    Driver
} from '../../services/driverService';
import { getAllCategories, VehicleCategory } from '../../services/categoryService';

const DriverDetailsScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { driverId } = route.params as { driverId: string };

    const [driver, setDriver] = useState<Driver | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [categories, setCategories] = useState<VehicleCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const response = await getDriverDetails(driverId);
            if (response.success) {
                setDriver(response.driver);
            } else {
                Alert.alert('Error', 'Failed to load driver details');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error fetching driver details:', error);
            Alert.alert('Error', 'Failed to load driver details');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await getAllCategories();
            if (response.success) {
                setCategories(response.categories);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        fetchDetails();
        fetchCategories();
    }, [driverId]);

    const handleApprove = async () => {
        Alert.alert(
            'Approve Driver',
            'Are you sure you want to approve this driver? They will be able to start accepting rides.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    style: 'default',
                    onPress: async () => {
                        try {
                            setActionLoading(true);
                            const response = await approveDriver(driverId);
                            if (response.success) {
                                Alert.alert('Success', 'Driver approved successfully');
                                fetchDetails(); // Refresh details
                            } else {
                                Alert.alert('Error', response.message || 'Failed to approve driver');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to approve driver');
                        } finally {
                            setActionLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            Alert.alert('Required', 'Please enter a reason for rejection');
            return;
        }

        try {
            setActionLoading(true);
            const response = await rejectDriver(driverId, rejectReason);
            if (response.success) {
                setRejectModalVisible(false);
                Alert.alert('Success', 'Driver rejected successfully');
                fetchDetails();
            } else {
                Alert.alert('Error', response.message || 'Failed to reject driver');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to reject driver');
        } finally {
            setActionLoading(false);
        }
    };



    const handleUpdateCategory = async () => {
        if (!selectedCategory) return;

        try {
            setActionLoading(true);
            const response = await updateDriverCategory(driverId, selectedCategory);
            if (response.success) {
                setCategoryModalVisible(false);
                Alert.alert('Success', 'Driver category updated successfully');
                fetchDetails();
            } else {
                Alert.alert('Error', response.message || 'Failed to update category');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update category');
        } finally {
            setActionLoading(false);
        }
    };

    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const [selectedDocLabel, setSelectedDocLabel] = useState<string>('');
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [verifiedDocs, setVerifiedDocs] = useState<Record<string, boolean>>({});

    const handleDocumentAction = async (action: 'verify' | 'flag') => {
        if (!driver || !driverId) return;

        try {
            setActionLoading(true);
            const status = action === 'verify' ? 'approved' : 'rejected';
            const reason = action === 'flag' ? `Issue with ${selectedDocLabel}` : undefined;

            const response = await verifyDocument(
                driverId,
                selectedDocLabel, // using label as key, normally you'd use a strict key like 'idFront'
                status,
                reason,
                selectedDocLabel
            );

            if (response.success) {
                // Update local state for immediate feedback
                setVerifiedDocs(prev => ({ ...prev, [selectedDocLabel]: action === 'verify' }));
                setImageModalVisible(false);
                Alert.alert('Success', `${selectedDocLabel} marked as ${status}.`);
                fetchDetails(); // Refresh full driver object to get new docStatuses
            } else {
                Alert.alert('Error', response.message || `Failed to mark ${selectedDocLabel}`);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || `Failed to update document status`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!driver) return;

        // Invert the current status for the API call
        // Note: status might be string 'pending', 'approved', etc. 
        // Usually toggle is for 'enabled' vs 'disabled' state for approved drivers
        // If we assume 'approved' drivers can be disabled (suspended), let's check current state

        const isCurrentlyEnabled = driver.isEnabled !== false; // Default to true if undefined? Or check status
        const newStatus = !isCurrentlyEnabled;

        Alert.alert(
            newStatus ? 'Enable Driver' : 'Disable Driver',
            `Are you sure you want to ${newStatus ? 'enable' : 'disable'} this driver?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setActionLoading(true);
                            const response = await toggleDriverStatus(driver.driverId || driver.uid || driver.id || '', newStatus);
                            if (response.success) {
                                Alert.alert('Success', `Driver ${newStatus ? 'enabled' : 'disabled'} successfully`);
                                fetchDetails();
                            } else {
                                Alert.alert('Error', response.message || 'Failed to update status');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to update status');
                        } finally {
                            setActionLoading(false);
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading driver details..." />;
    }

    if (!driver) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Driver not found</Text>
            </View>
        );
    }

    const isPending = (driver.registrationStatus || driver.status || '').toLowerCase() === 'pending';
    const isApproved = (driver.registrationStatus || driver.status || '').toLowerCase() === 'approved';
    const isRejected = (driver.registrationStatus || driver.status || '').toLowerCase() === 'rejected';

    const showVerificationActions = isPending || isRejected;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Driver Details</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content}>
                {/* Profile Section */}
                <View style={styles.section}>
                    <View style={styles.profileHeader}>
                        <Image
                            source={{ uri: driver.profilePhotoUrl || 'https://via.placeholder.com/100' }}
                            style={styles.profileImage}
                        />
                        <View style={styles.profileInfo}>
                            <Text style={styles.name}>{driver.name}</Text>
                            <Text style={styles.phone}>{driver.phone}</Text>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: isPending ? Colors.warning : isApproved ? Colors.success : Colors.error }
                            ]}>
                                <Text style={styles.statusText}>
                                    {driver.registrationStatus || driver.status}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Vehicle Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Vehicle Information</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Type:</Text>
                        <Text style={styles.value}>{driver.vehicleType}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Model:</Text>
                        <Text style={styles.value}>{driver.carModel} ({driver.carYear})</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Plate:</Text>
                        <Text style={styles.value}>{driver.plateNumber || driver.vehicleRegNo || 'Not Assigned'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Category:</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.value}>{driver.vehicleType || 'Not Assigned'}</Text>
                            <TouchableOpacity onPress={() => setCategoryModalVisible(true)} style={styles.editIcon}>
                                <Text style={{ color: Colors.primary, fontSize: FontSizes.sm, marginLeft: 8 }}>Edit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Documents */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Compliance Documents</Text>
                    <DocumentItem
                        label="ID Front"
                        docKey="ID Front"
                        url={driver.idFrontUrl}
                        statusObj={driver.docStatuses?.['ID Front']}
                        onPress={(url) => {
                            setSelectedDocLabel('ID Front');
                            setSelectedImageUrl(url);
                            setImageLoading(true);
                            setImageError(false);
                            setImageModalVisible(true);
                        }}
                    />
                    <DocumentItem
                        label="ID Back"
                        docKey="ID Back"
                        url={driver.idBackUrl}
                        statusObj={driver.docStatuses?.['ID Back']}
                        onPress={(url) => {
                            setSelectedDocLabel('ID Back');
                            setSelectedImageUrl(url);
                            setImageLoading(true);
                            setImageError(false);
                            setImageModalVisible(true);
                        }}
                    />
                    <DocumentItem
                        label="Driving License"
                        docKey="Driving License"
                        url={driver.licenseUrl}
                        statusObj={driver.docStatuses?.['Driving License']}
                        onPress={(url) => {
                            setSelectedDocLabel('Driving License');
                            setSelectedImageUrl(url);
                            setImageLoading(true);
                            setImageError(false);
                            setImageModalVisible(true);
                        }}
                    />
                    <DocumentItem
                        label="Good Conduct"
                        docKey="Good Conduct"
                        url={driver.goodConductUrl}
                        statusObj={driver.docStatuses?.['Good Conduct']}
                        onPress={(url) => {
                            setSelectedDocLabel('Good Conduct');
                            setSelectedImageUrl(url);
                            setImageLoading(true);
                            setImageError(false);
                            setImageModalVisible(true);
                        }}
                    />
                    <DocumentItem
                        label="Car Photo"
                        docKey="Car Photo"
                        url={driver.carImageUrl}
                        statusObj={driver.docStatuses?.['Car Photo']}
                        onPress={(url) => {
                            setSelectedDocLabel('Car Photo');
                            setSelectedImageUrl(url);
                            setImageLoading(true);
                            setImageError(false);
                            setImageModalVisible(true);
                        }}
                    />
                    <DocumentItem
                        label="Logbook"
                        docKey="Logbook"
                        url={driver.carRegistrationUrl}
                        statusObj={driver.docStatuses?.['Logbook']}
                        onPress={(url) => {
                            setSelectedDocLabel('Logbook');
                            setSelectedImageUrl(url);
                            setImageLoading(true);
                            setImageError(false); // Reset error state
                            setImageModalVisible(true);
                        }}
                    />
                </View>

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.button, styles.approveButton]}
                        onPress={handleApprove}
                        disabled={actionLoading}
                    >
                        <Text style={styles.buttonText}>Approve Driver</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.rejectButton]}
                        onPress={() => setRejectModalVisible(true)}
                        disabled={actionLoading}
                    >
                        <Text style={styles.buttonText}>Reject Driver</Text>
                    </TouchableOpacity>

                    {isApproved && (
                        <TouchableOpacity
                            style={[
                                styles.button,
                                driver.isEnabled === false ? styles.enableButton : styles.disableButton
                            ]}
                            onPress={handleToggleStatus}
                            disabled={actionLoading}
                        >
                            <Text style={styles.buttonText}>
                                {driver.isEnabled === false ? 'Enable Driver' : 'Disable Driver'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {/* Reject Modal */}
            <Modal
                visible={rejectModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setRejectModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Reject Driver</Text>
                        <Text style={styles.modalLabel}>Reason for rejection:</Text>
                        <TextInput
                            style={styles.detailsInput}
                            multiline
                            numberOfLines={4}
                            value={rejectReason}
                            onChangeText={setRejectReason}
                            placeholder="Enter reason..."
                            placeholderTextColor={Colors.textMuted}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setRejectModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmRejectButton]}
                                onPress={handleReject}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <LoadingSpinner size="small" />
                                ) : (
                                    <Text style={styles.confirmRejectText}>Reject</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            {/* Category Modal */}
            <Modal
                visible={categoryModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setCategoryModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Vehicle Category</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat.categoryId}
                                    style={[
                                        styles.categoryOption,
                                        selectedCategory === cat.categoryId && styles.categoryOptionSelected
                                    ]}
                                    onPress={() => setSelectedCategory(cat.categoryId)}
                                >
                                    <Text style={[
                                        styles.categoryText,
                                        selectedCategory === cat.categoryId && styles.categoryTextSelected
                                    ]}>
                                        {cat.name}
                                    </Text>
                                    {selectedCategory === cat.categoryId && (
                                        <Text style={{ color: Colors.primary }}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setCategoryModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveCategoryButton]}
                                onPress={handleUpdateCategory}
                                disabled={!selectedCategory || actionLoading}
                            >
                                <Text style={styles.saveCategoryText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Image Viewer Modal */}
            <Modal
                visible={imageModalVisible}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setImageModalVisible(false)}
            >
                <SafeAreaView style={styles.imageModalOverlay} edges={['top', 'bottom']}>
                    <View style={styles.imageModalContainer}>
                        {/* Glassmorphic Header */}
                        <View style={styles.imageModalHeader}>
                            <Text style={styles.imageDocTitle}>{selectedDocLabel}</Text>
                            <TouchableOpacity
                                style={styles.closeImageButtonCircle}
                                onPress={() => setImageModalVisible(false)}
                            >
                                <Text style={styles.closeIconSmall}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.imageModalContent}>
                            {selectedImageUrl && !imageError ? (
                                <View style={styles.imageContainerLarge}>
                                    <Image
                                        source={{ uri: selectedImageUrl }}
                                        style={styles.fullImage}
                                        resizeMode="contain"
                                        onLoadStart={() => setImageLoading(true)}
                                        onLoad={() => {
                                            setImageLoading(false);
                                            setImageError(false);
                                        }}
                                        onLoadEnd={() => setImageLoading(false)}
                                        onError={() => {
                                            setImageLoading(false);
                                            setImageError(true);
                                        }}
                                    />
                                    {imageLoading && (
                                        <View style={styles.imageLoader}>
                                            <LoadingSpinner size="large" color={Colors.white} />
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <View style={styles.centerContainer}>
                                    <Text style={styles.errorText}>
                                        {imageError ? 'Failed to load image. Check URL.' : 'No image available'}
                                    </Text>
                                    {imageError && (
                                        <Text style={styles.urlDebugText}>{selectedImageUrl}</Text>
                                    )}
                                </View>
                            )}
                        </View>

                        {/* Verification Actions Bar */}
                        <View style={styles.verificationBar}>
                            <TouchableOpacity
                                style={[styles.verifButton, styles.flagButton]}
                                onPress={() => handleDocumentAction('flag')}
                            >
                                <Text style={styles.verifButtonText}>Flag Issue</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.verifButton, styles.verifyDocButton]}
                                onPress={() => handleDocumentAction('verify')}
                            >
                                <Text style={styles.verifButtonText}>✓ Verify</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const DocumentItem = ({
    label,
    docKey,
    url,
    statusObj,
    onPress
}: {
    label: string;
    docKey: string;
    url?: string;
    statusObj?: { status: string; reason?: string };
    onPress: (url: string) => void
}) => {
    const isVerified = statusObj?.status === 'approved';
    const isRejected = statusObj?.status === 'rejected';

    return (
        <View style={styles.docItemContainer}>
            <TouchableOpacity
                style={styles.docItem}
                disabled={!url}
                onPress={() => url && onPress(url)}
            >
                <View style={styles.docLabelRow}>
                    {isVerified && <Text style={styles.verifiedCheck}>✓ </Text>}
                    {isRejected && <Text style={styles.rejectedCross}>✕ </Text>}
                    <Text style={[
                        styles.docLabel,
                        isVerified && styles.docLabelVerified,
                        isRejected && styles.docLabelRejected
                    ]}>{label}</Text>
                </View>
                <View style={styles.docStatusRow}>
                    {isVerified && <View style={styles.tagVerified}><Text style={styles.tagTextVerified}>Verified</Text></View>}
                    {isRejected && <View style={styles.tagRejected}><Text style={styles.tagTextRejected}>Rejected</Text></View>}
                    <Text style={[styles.docStatus, { color: url ? Colors.primary : Colors.textMuted }]}>
                        {url ? 'View ›' : 'Missing'}
                    </Text>
                </View>
            </TouchableOpacity>
            {isRejected && statusObj?.reason && (
                <Text style={styles.rejectionReasonText}>Reason: {statusObj.reason}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        padding: Spacing.sm,
    },
    backButtonText: {
        color: Colors.primary,
        fontSize: FontSizes.md,
        fontWeight: FontWeights.medium,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.bold,
        color: Colors.textPrimary,
    },
    placeholder: {
        width: 60,
    },
    content: {
        flex: 1,
    },
    section: {
        backgroundColor: Colors.surface,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.background,
    },
    profileInfo: {
        marginLeft: Spacing.lg,
    },
    name: {
        fontSize: FontSizes.xl,
        fontWeight: FontWeights.bold,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    phone: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    statusBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.md,
        alignSelf: 'flex-start',
    },
    statusText: {
        color: Colors.white,
        fontSize: FontSizes.xs,
        fontWeight: FontWeights.bold,
        textTransform: 'uppercase',
    },
    sectionTitle: {
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.semibold,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    label: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
    },
    value: {
        fontSize: FontSizes.md,
        color: Colors.textPrimary,
        fontWeight: FontWeights.medium,
    },
    docItemContainer: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingVertical: Spacing.md,
    },
    docItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    docLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    docStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    docLabel: {
        fontSize: FontSizes.md,
        color: Colors.textPrimary,
    },
    docStatus: {
        fontSize: FontSizes.md,
        fontWeight: FontWeights.medium,
        marginLeft: Spacing.sm,
    },
    actions: {
        padding: Spacing.lg,
        marginBottom: Spacing.xxl,
    },
    button: {
        width: '100%',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    approveButton: {
        backgroundColor: Colors.success,
    },
    rejectButton: {
        backgroundColor: Colors.error,
    },
    enableButton: {
        backgroundColor: Colors.success,
    },
    disableButton: {
        backgroundColor: Colors.warning, // Or a dark grey
    },
    buttonText: {
        color: Colors.white,
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.bold,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: Colors.error,
        fontSize: FontSizes.lg,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    modalContent: {
        width: '100%',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
    },
    modalTitle: {
        fontSize: FontSizes.xl,
        fontWeight: FontWeights.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.lg,
        textAlign: 'center',
    },
    modalLabel: {
        fontSize: FontSizes.md,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    detailsInput: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        color: Colors.textPrimary,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: Spacing.lg,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: Colors.surfaceLight,
        marginRight: Spacing.md,
    },
    confirmRejectButton: {
        backgroundColor: Colors.error,
    },
    cancelButtonText: {
        color: Colors.textPrimary,
        fontWeight: FontWeights.medium,
    },
    confirmRejectText: {
        color: Colors.white,
        fontWeight: FontWeights.bold,
    },
    editIcon: {
        padding: 4,
    },
    categoryOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    categoryOptionSelected: {
        backgroundColor: Colors.primary + '10',
    },
    categoryText: {
        fontSize: FontSizes.md,
        color: Colors.textPrimary,
    },
    categoryTextSelected: {
        color: Colors.primary,
        fontWeight: 'bold',
    },
    saveCategoryButton: {
        backgroundColor: Colors.primary,
    },
    saveCategoryText: {
        color: Colors.white,
        fontWeight: 'bold',
    },
    imageModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
    },
    imageModalContainer: {
        flex: 1,
    },
    imageModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
    },
    imageDocTitle: {
        color: Colors.white,
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
    },
    closeImageButtonCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeIconSmall: {
        color: Colors.white,
        fontSize: 16,
    },
    imageModalContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainerLarge: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    imageLoader: {
        position: 'absolute',
    },
    verificationBar: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.lg,
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    verifButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    flagButton: {
        backgroundColor: 'rgba(255,59,48,0.2)',
        marginRight: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.error,
    },
    verifyDocButton: {
        backgroundColor: Colors.success,
    },
    verifButtonText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: FontSizes.md,
    },
    docLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    verifiedCheck: {
        color: Colors.success,
        fontWeight: 'bold',
        fontSize: FontSizes.lg,
    },
    rejectedCross: {
        color: Colors.error,
        fontWeight: 'bold',
        fontSize: FontSizes.lg,
    },
    docLabelVerified: {
        color: Colors.textSecondary,
    },
    docLabelRejected: {
        color: Colors.error,
    },
    tagVerified: {
        backgroundColor: Colors.success + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginRight: 8,
    },
    tagTextVerified: {
        color: Colors.success,
        fontSize: FontSizes.xs,
        fontWeight: 'bold',
    },
    tagRejected: {
        backgroundColor: Colors.error + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginRight: 8,
    },
    tagTextRejected: {
        color: Colors.error,
        fontSize: FontSizes.xs,
        fontWeight: 'bold',
    },
    rejectionReasonText: {
        color: Colors.error,
        fontSize: FontSizes.sm,
        marginTop: 4,
        fontStyle: 'italic',
    },
    urlDebugText: {
        color: Colors.textMuted,
        fontSize: FontSizes.xs,
        marginTop: Spacing.sm,
        textAlign: 'center',
        paddingHorizontal: Spacing.xl,
    },
});

export default DriverDetailsScreen;
