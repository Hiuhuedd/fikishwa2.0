import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Briefcase, Star, Pencil } from 'lucide-react-native';

interface QuickPlacesProps {
    colors: any;
    fontSizes: any;
    user: any;
    onAddPlace: (type: 'Home' | 'Work' | 'Other') => void;
    onSelectPlace: (place: any) => void;
    onEditPlace: (place: any) => void;
}

const QuickPlaces = ({
    colors,
    fontSizes,
    user,
    onAddPlace,
    onSelectPlace,
    onEditPlace,
}: QuickPlacesProps) => {
    const savedPlaces = user?.savedPlaces || [];
    const hasHome = savedPlaces.find((p: any) => p.label === 'Home');
    const hasWork = savedPlaces.find((p: any) => p.label === 'Work');

    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: fontSizes.lg }]}>
                    Ready to go?
                </Text>
            </View>

            <View style={styles.list}>
                {/* Add Home if missing */}
                {!hasHome && (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => onAddPlace('Home')}
                        style={[styles.quickPlace, { backgroundColor: colors.background, borderColor: colors.border }]}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '10' }]}>
                            <Home size={18} color={colors.primary} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.label, { color: colors.textPrimary, fontSize: fontSizes.md }]} numberOfLines={1}>Add Home</Text>
                            <Text style={[styles.subText, { color: colors.textSecondary, fontSize: fontSizes.xs }]} numberOfLines={1}>Save your home</Text>
                        </View>
                    </TouchableOpacity>
                )}

                {/* Add Work if missing */}
                {!hasWork && (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => onAddPlace('Work')}
                        style={[styles.quickPlace, { backgroundColor: colors.background, borderColor: colors.border }]}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '10' }]}>
                            <Briefcase size={18} color={colors.primary} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.label, { color: colors.textPrimary, fontSize: fontSizes.md }]} numberOfLines={1}>Add Work</Text>
                            <Text style={[styles.subText, { color: colors.textSecondary, fontSize: fontSizes.xs }]} numberOfLines={1}>Save your office</Text>
                        </View>
                    </TouchableOpacity>
                )}

                {/* Saved Places List */}
                {savedPlaces.map((place: any, index: number) => (
                    <TouchableOpacity
                        key={index}
                        activeOpacity={0.7}
                        onPress={() => onSelectPlace(place)}
                        style={[styles.quickPlace, { backgroundColor: colors.background, borderColor: colors.border }]}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '12' }]}>
                            {place.label.toLowerCase() === 'home' ? (
                                <Home size={18} color={colors.primary} />
                            ) : place.label.toLowerCase() === 'work' ? (
                                <Briefcase size={18} color={colors.primary} />
                            ) : (
                                <Star size={18} color={colors.primary} />
                            )}
                        </View>
                        <View style={styles.textContainer}>
                            <View style={styles.row}>
                                <Text style={[styles.label, { color: colors.textPrimary, fontSize: fontSizes.md }]} numberOfLines={1}>
                                    {place.label}
                                </Text>
                                <TouchableOpacity
                                    activeOpacity={0.6}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        onEditPlace(place);
                                    }}
                                    style={[styles.miniEditButton, { borderColor: colors.border }]}
                                >
                                    <Pencil size={12} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.subText, { color: colors.textSecondary, fontSize: fontSizes.xs }]} numberOfLines={1}>
                                {place.address}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingBottom: 12 },
    sectionHeader: { marginBottom: 16 },
    sectionTitle: { fontWeight: '800', letterSpacing: -0.5 },
    list: { gap: 12 },
    quickPlace: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        marginLeft: 12,
        flex: 1,
    },
    label: {
        fontWeight: '700',
    },
    subText: {
        marginTop: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    miniEditButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});

export default QuickPlaces;
