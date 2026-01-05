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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../../theme';
import LoadingSpinner from '../../components/LoadingSpinner';
import CategoryCard from '../../components/CategoryCard';
import {
    getAllCategories,
    createCategory,
    updateCategory,
    toggleCategory,
    VehicleCategory,
} from '../../services/categoryService';

const CategoriesScreen: React.FC = () => {
    const navigation = useNavigation();
    const [categories, setCategories] = useState<VehicleCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [baseFare, setBaseFare] = useState('');
    const [perKm, setPerKm] = useState('');
    const [perMin, setPerMin] = useState('');
    const [minFare, setMinFare] = useState('');
    const [maxPassengers, setMaxPassengers] = useState('4');
    const [imageUrl, setImageUrl] = useState('');

    const fetchCategories = async () => {
        try {
            if (!refreshing) setLoading(true);
            const response = await getAllCategories();
            if (response.success) {
                setCategories(response.categories || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchCategories();
    }, []);

    const openDrawer = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            // Optimistic update
            setCategories(prev => prev.map(c => c.categoryId === id ? { ...c, isActive: !currentStatus } : c));

            await toggleCategory(id, !currentStatus);
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
            fetchCategories(); // Revert on failure
        }
    };

    const openModal = (category?: VehicleCategory) => {
        if (category) {
            setEditingId(category.categoryId);
            setName(category.name);
            setBaseFare(category.baseFare.toString());
            setPerKm(category.perKmRate.toString());
            setPerMin(category.perMinuteRate.toString());
            setMinFare(category.minimumFare.toString());
            setMaxPassengers(category.maxPassengers.toString());
            setImageUrl(category.image || '');
        } else {
            setEditingId(null);
            cleanupForm();
        }
        setModalVisible(true);
    };

    const cleanupForm = () => {
        setName('');
        setBaseFare('');
        setPerKm('');
        setPerMin('');
        setMinFare('');
        setMaxPassengers('4');
        setImageUrl('');
    };

    const handleSave = async () => {
        if (!name || !baseFare || !perKm || !minFare) {
            Alert.alert('Validation Error', 'Please fill all required fields');
            return;
        }

        setSaving(true);
        try {
            const categoryData: Partial<VehicleCategory> = {
                name,
                baseFare: parseFloat(baseFare),
                perKmRate: parseFloat(perKm),
                perMinuteRate: parseFloat(perMin) || 0,
                minimumFare: parseFloat(minFare),
                maxPassengers: parseInt(maxPassengers),
                image: imageUrl,
                isActive: editingId ? undefined : true, // Default active for new
            };

            let response;
            if (editingId) {
                response = await updateCategory(editingId, categoryData);
            } else {
                // Generate categoryId from name
                const generatedId = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                const newCategoryData = {
                    ...categoryData,
                    categoryId: generatedId,
                };
                response = await createCategory(newCategoryData);
            }

            if (response.success) {
                Alert.alert('Success', `Category ${editingId ? 'updated' : 'created'} successfully`);
                setModalVisible(false);
                fetchCategories();
            } else {
                Alert.alert('Error', response.message);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save category');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
                    <Text style={styles.menuIcon}>☰</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Vehicle Categories</Text>
                <TouchableOpacity onPress={fetchCategories} style={styles.refreshButton}>
                    <Text style={styles.refreshIcon}>↻</Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            {loading && !refreshing ? (
                <LoadingSpinner message="Loading categories..." />
            ) : (
                <FlatList
                    data={categories}
                    renderItem={({ item }) => (
                        <CategoryCard
                            category={item}
                            onEdit={openModal}
                            onToggleStatus={handleToggleStatus}
                        />
                    )}
                    keyExtractor={(item) => item.categoryId}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>🚗</Text>
                            <Text style={styles.emptyText}>No vehicle categories</Text>
                            <Text style={styles.emptySubtext}>Add categories to start operations</Text>
                        </View>
                    }
                />
            )}

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => openModal()}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            {/* Create/Edit Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editingId ? 'Edit Category' : 'New Vehicle Category'}
                        </Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Category Name (e.g. Economy)</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Name"
                                placeholderTextColor={Colors.textMuted}
                            />

                            <Text style={styles.sectionHeader}>Pricing (KES)</Text>

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>Base Fare</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={baseFare}
                                        onChangeText={setBaseFare}
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                        placeholderTextColor={Colors.textMuted}
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>Min Fare</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={minFare}
                                        onChangeText={setMinFare}
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                        placeholderTextColor={Colors.textMuted}
                                    />
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>Per KM</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={perKm}
                                        onChangeText={setPerKm}
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                        placeholderTextColor={Colors.textMuted}
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>Per Min</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={perMin}
                                        onChangeText={setPerMin}
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                        placeholderTextColor={Colors.textMuted}
                                    />
                                </View>
                            </View>

                            <Text style={styles.sectionHeader}>Details</Text>

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>Max Passengers</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={maxPassengers}
                                        onChangeText={setMaxPassengers}
                                        placeholder="4"
                                        keyboardType="numeric"
                                        placeholderTextColor={Colors.textMuted}
                                    />
                                </View>
                            </View>

                            <Text style={styles.label}>Image URL (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={imageUrl}
                                onChangeText={setImageUrl}
                                placeholder="https://example.com/car.png"
                                placeholderTextColor={Colors.textMuted}
                            />

                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelBtn]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveBtn]}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <LoadingSpinner size="small" color={Colors.white} />
                                ) : (
                                    <Text style={styles.saveText}>Save</Text>
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
        paddingBottom: 100,
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
        maxHeight: '90%',
    },
    modalTitle: {
        fontSize: FontSizes.xl,
        fontWeight: FontWeights.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.lg,
        textAlign: 'center',
    },
    sectionHeader: {
        fontSize: FontSizes.sm,
        fontWeight: FontWeights.bold,
        color: Colors.primary,
        marginTop: Spacing.sm,
        marginBottom: Spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
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
    modalActions: {
        flexDirection: 'row',
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
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
    saveBtn: {
        backgroundColor: Colors.primary,
    },
    cancelText: {
        color: Colors.textPrimary,
        fontWeight: FontWeights.medium,
    },
    saveText: {
        color: Colors.white,
        fontWeight: FontWeights.bold,
    }
});

export default CategoriesScreen;
