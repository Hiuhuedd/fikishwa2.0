import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    StatusBar, FlatList, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import {
    ChevronLeft, Home, Briefcase, MapPin,
    Trash2, Plus, Map, ChevronRight
} from 'lucide-react-native';

const SavedPlacesScreen = () => {
    const navigation = useNavigation<any>();
    const { colors, spacing, fontSizes } = useTheme();
    const { user, updateUser } = useAuthStore();

    const savedPlaces = user?.savedPlaces || [];

    const handleRemovePlace = (label: string) => {
        Alert.alert(
            'Remove Place',
            `Are you sure you want to remove "${label}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        const updated = savedPlaces.filter(p => p.label !== label);
                        updateUser({ savedPlaces: updated });
                    }
                },
            ]
        );
    };

    const getIcon = (label: string) => {
        switch (label.toLowerCase()) {
            case 'home': return <Home size={20} color={colors.primary} />;
            case 'work': return <Briefcase size={20} color={colors.primary} />;
            default: return <MapPin size={20} color={colors.primary} />;
        }
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" />
            <View style={[styles.header, { paddingHorizontal: spacing.screenPadding, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, { backgroundColor: colors.backgroundCard }]}
                >
                    <ChevronLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Saved Places</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={savedPlaces}
                keyExtractor={(item) => item.label + item.address}
                contentContainerStyle={{ padding: spacing.screenPadding, paddingBottom: 40 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={[styles.emptyIconContainer, { backgroundColor: colors.primaryLight }]}>
                            <Map size={40} color={colors.primary} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No saved places</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                            Save your frequent destinations for faster booking.
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                            {getIcon(item.label)}
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.labelText, { color: colors.textPrimary }]}>{item.label}</Text>
                            <Text style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={2}>
                                {item.address}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => handleRemovePlace(item.label)}
                            style={styles.deleteButton}
                        >
                            <Trash2 size={18} color={colors.error} />
                        </TouchableOpacity>
                    </View>
                )}
            />

            <View style={[styles.footer, { paddingHorizontal: spacing.screenPadding }]}>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.primary }]}
                    onPress={() => navigation.navigate('Home')} // Home has the map selection logic
                >
                    <Plus size={20} color="#FFF" />
                    <Text style={styles.addButtonText}>Add New Place</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 16, borderBottomWidth: 1,
    },
    backButton: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: 20, fontWeight: '800' },
    card: {
        flexDirection: 'row', alignItems: 'center',
        padding: 16, borderRadius: 20, borderWidth: 1,
        marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    iconContainer: {
        width: 48, height: 48, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
    },
    textContainer: { flex: 1, marginLeft: 16, marginRight: 8 },
    labelText: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    addressText: { fontSize: 13, lineHeight: 18 },
    deleteButton: {
        width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    },
    footer: {
        paddingVertical: 20,
    },
    addButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        height: 56, borderRadius: 18, gap: 10,
        shadowColor: '#D4AF37', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
    },
    addButtonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
    emptyContainer: {
        alignItems: 'center', marginTop: 80, paddingHorizontal: 40
    },
    emptyIconContainer: {
        width: 80, height: 80, borderRadius: 40,
        alignItems: 'center', justifyContent: 'center', marginBottom: 20
    },
    emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
    emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
});

export default SavedPlacesScreen;
