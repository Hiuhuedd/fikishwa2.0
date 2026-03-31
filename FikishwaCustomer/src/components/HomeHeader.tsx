import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Menu, User, ChevronRight } from 'lucide-react-native';

interface HomeHeaderProps {
    colors: any;
    fontSizes: any;
    spacing: any;
    user: any;
    greeting: string;
    insets: any;
    isSelectingSavedPlace: boolean;
    selectingPlaceType: string | null;
    onMenuPress: () => void;
    onProfilePress: () => void;
    onSearchPress: () => void;
    onCancelSelection: () => void;
}

const HomeHeader = ({
    colors,
    fontSizes,
    spacing,
    user,
    greeting,
    insets,
    isSelectingSavedPlace,
    selectingPlaceType,
    onMenuPress,
    onProfilePress,
    onSearchPress,
    onCancelSelection,
}: HomeHeaderProps) => {
    return (
        <SafeAreaView style={[styles.topOverlay, { paddingTop: insets.top }]}>
            <View style={[styles.topBar, { paddingHorizontal: spacing.screenPadding }]}>
                {/* Greeting or Selection Title */}
                <View style={styles.greetingBlock}>
                    {isSelectingSavedPlace ? (
                        <>
                            <TouchableOpacity
                                onPress={onCancelSelection}
                                style={[styles.backCircle, { backgroundColor: colors.backgroundCard }]}
                            >
                                <ChevronRight
                                    size={20}
                                    color={colors.textPrimary}
                                    style={{ transform: [{ rotate: '180deg' }] }}
                                />
                            </TouchableOpacity>
                            <Text style={[styles.selectionTitle, { color: colors.textPrimary }]}>
                                Set your {selectingPlaceType} location
                            </Text>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity
                                onPress={onMenuPress}
                                style={[styles.menuButton, { backgroundColor: colors.primary }]}
                            >
                                <Menu size={16} color="#fff" />
                            </TouchableOpacity>
                            <Text style={[styles.greeting, { color: colors.textPrimary, fontSize: fontSizes.sm }]}>
                                {greeting}, <Text style={{ fontWeight: '700' }}>{user?.name?.split(' ')[0] || 'there'}</Text>
                            </Text>
                        </>
                    )}
                </View>

                {/* Avatar (Hidden in Selection Mode) */}
                {!isSelectingSavedPlace && (
                    <TouchableOpacity
                        onPress={onProfilePress}
                        style={[styles.avatar, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
                    >
                        <User size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Search Bar - Hidden in Selection Mode */}
            {!isSelectingSavedPlace && (
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={onSearchPress}
                    style={[styles.searchBar, {
                        backgroundColor: colors.backgroundCard,
                        borderColor: colors.border,
                        marginHorizontal: spacing.screenPadding,
                        shadowColor: colors.shadow,
                        marginTop: 12,
                    }]}
                >
                    <View style={[styles.searchDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.searchPlaceholder, { color: colors.textTertiary, fontSize: fontSizes.md }]}>
                        Where to?
                    </Text>
                    <View style={[styles.nowBadge, { backgroundColor: colors.primary + '15' }]}>
                        <Text style={{ color: colors.primary, fontSize: fontSizes.xs, fontWeight: '700' }}>NOW</Text>
                    </View>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    topOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    greetingBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    menuButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    greeting: {
        fontWeight: '500',
        letterSpacing: -0.2,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        elevation: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    searchDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 12,
    },
    searchPlaceholder: {
        flex: 1,
        fontWeight: '600',
    },
    nowBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    backCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    selectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
});

export default HomeHeader;
