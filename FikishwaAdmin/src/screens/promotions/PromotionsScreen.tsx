import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Modal,
    TextInput,
    ScrollView,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../../theme';
import LoadingSpinner from '../../components/LoadingSpinner';
import PromoCard from '../../components/PromoCard';
import {
    getAllPromotions,
    createPromotion,
    deletePromotion,
    Promotion,
} from '../../services/promotionService';

const PromotionsScreen: React.FC = () => {
    const navigation = useNavigation();
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [code, setCode] = useState('');
    const [value, setValue] = useState('');
    const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
    const [description, setDescription] = useState('');
    const [expiryDays, setExpiryDays] = useState('');
    const [creating, setCreating] = useState(false);

    const fetchPromotions = async () => {
        try {
            if (!refreshing) setLoading(true);
            const response = await getAllPromotions();
            if (response.success) {
                setPromotions(response.promotions);
            }
        } catch (error) {
            console.error('Error fetching promotions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPromotions();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchPromotions();
    }, []);

    const openDrawer = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    const handleDelete = (promoCode: string) => {
        Alert.alert(
            'Delete Promotion',
            `Are you sure you want to delete ${promoCode}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await deletePromotion(promoCode);
                            if (response.success) {
                                Alert.alert('Success', 'Promotion deleted');
                                fetchPromotions();
                            } else {
                                Alert.alert('Error', response.message);
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete');
                        }
                    },
                },
            ]
        );
    };

    const handleCreate = async () => {
        if (!code || !value) {
            Alert.alert('Required', 'Please enter a code and value');
            return;
        }

        setCreating(true);
        try {
            // Calculate expiry date
            const days = parseInt(expiryDays) || 30;
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + days);

            const newPromo: Partial<Promotion> = {
                code: code.toUpperCase(),
                value: parseFloat(value),
                type,
                description,
                expiryDate: expiryDate.toISOString(),
                isActive: true,
                usageLimit: 100, // Default for now
            };

            const response = await createPromotion(newPromo);
            if (response.success) {
                setModalVisible(false);
                cleanupForm();
                Alert.alert('Success', 'Promotion created!');
                fetchPromotions();
            } else {
                Alert.alert('Error', response.message);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create promotion');
        } finally {
            setCreating(false);
        }
    };

    const cleanupForm = () => {
        setCode('');
        setValue('');
        setDescription('');
        setExpiryDays('');
        setType('percentage');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
                    <Text style={styles.menuIcon}>☰</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Promotions</Text>
                <TouchableOpacity onPress={fetchPromotions} style={styles.refreshButton}>
                    <Text style={styles.refreshIcon}>↻</Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            {loading && !refreshing ? (
                <LoadingSpinner message="Loading promotions..." />
            ) : (
                <FlatList
                    data={promotions}
                    renderItem={({ item }) => (
                        <PromoCard promotion={item} onDelete={handleDelete} />
                    )}
                    keyExtractor={(item) => item.code}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>🎫</Text>
                            <Text style={styles.emptyText}>No active promotions</Text>
                            <Text style={styles.emptySubtext}>Create one to get started</Text>
                        </View>
                    }
                />
            )}

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            {/* Create Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>New Promotion</Text>

                        <ScrollView>
                            <Text style={styles.label}>Code (e.g. SAVE20)</Text>
                            <TextInput
                                style={styles.input}
                                value={code}
                                onChangeText={text => setCode(text.toUpperCase())}
                                placeholder="CODE"
                                placeholderTextColor={Colors.textMuted}
                                autoCapitalize="characters"
                            />

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>Type</Text>
                                    <View style={styles.typeSelector}>
                                        <TouchableOpacity
                                            style={[styles.typeBtn, type === 'percentage' && styles.typeBtnActive]}
                                            onPress={() => setType('percentage')}
                                        >
                                            <Text style={[styles.typeText, type === 'percentage' && styles.typeTextActive]}>%</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.typeBtn, type === 'fixed' && styles.typeBtnActive]}
                                            onPress={() => setType('fixed')}
                                        >
                                            <Text style={[styles.typeText, type === 'fixed' && styles.typeTextActive]}>$</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>Value</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={value}
                                        onChangeText={setValue}
                                        placeholder="0"
                                        placeholderTextColor={Colors.textMuted}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <Text style={styles.label}>Validity (Days)</Text>
                            <TextInput
                                style={styles.input}
                                value={expiryDays}
                                onChangeText={setExpiryDays}
                                placeholder="30"
                                placeholderTextColor={Colors.textMuted}
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={styles.input}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Off first trip"
                                placeholderTextColor={Colors.textMuted}
                            />
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelBtn]}
                                onPress={() => {
                                    setModalVisible(false);
                                    cleanupForm();
                                }}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.createBtn]}
                                onPress={handleCreate}
                                disabled={creating}
                            >
                                {creating ? (
                                    <LoadingSpinner size="small" color={Colors.white} />
                                ) : (
                                    <Text style={styles.createText}>Create</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
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
    menuButton: {
        padding: Spacing.sm,
        marginRight: Spacing.md,
    },
    menuIcon: {
        fontSize: 24,
        color: Colors.textPrimary,
    },
    headerTitle: {
        flex: 1,
        fontSize: FontSizes.xl,
        fontWeight: FontWeights.bold,
        color: Colors.textPrimary,
    },
    refreshButton: {
        padding: Spacing.sm,
    },
    refreshIcon: {
        fontSize: 24,
        color: Colors.primary,
    },
    listContent: {
        padding: Spacing.md,
        paddingBottom: 100, // Space for FAB
    },
    fab: {
        position: 'absolute',
        bottom: Spacing.xl,
        right: Spacing.xl,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.lg,
    },
    fabText: {
        fontSize: 32,
        color: Colors.white,
        fontWeight: 'bold',
        marginTop: -4,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: Spacing.xxl,
        padding: Spacing.xl,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: Spacing.md,
    },
    emptyText: {
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.bold,
        color: Colors.textPrimary,
    },
    emptySubtext: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: Colors.overlay,
        justifyContent: 'center',
        padding: Spacing.lg,
    },
    modalContent: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: FontSizes.xl,
        fontWeight: FontWeights.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.lg,
        textAlign: 'center',
    },
    label: {
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    input: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    typeSelector: {
        flexDirection: 'row',
        marginBottom: Spacing.md,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
    },
    typeBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    typeBtnActive: {
        backgroundColor: Colors.primary + '20',
    },
    typeText: {
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.bold,
        color: Colors.textMuted,
    },
    typeTextActive: {
        color: Colors.primary,
    },
    modalActions: {
        flexDirection: 'row',
        marginTop: Spacing.md,
    },
    modalButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: Colors.surfaceLight,
        marginRight: Spacing.md,
    },
    createBtn: {
        backgroundColor: Colors.primary,
    },
    cancelText: {
        color: Colors.textPrimary,
        fontWeight: FontWeights.medium,
    },
    createText: {
        color: Colors.white,
        fontWeight: FontWeights.bold,
    }
});

export default PromotionsScreen;
