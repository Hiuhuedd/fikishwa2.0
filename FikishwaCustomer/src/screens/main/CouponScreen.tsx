import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    StatusBar, TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { ChevronLeft, Search } from 'lucide-react-native';

const CouponScreen = () => {
    const navigation = useNavigation<any>();
    const { colors, spacing } = useTheme();
    const [code, setCode] = useState('');

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ChevronLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>List of Coupons</Text>
                <TouchableOpacity style={styles.iconBtn}>
                    <Search size={22} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Input */}
                <View style={[styles.inputContainer, { backgroundColor: colors.backgroundCard }]}>
                    <TextInput
                        style={[styles.input, { color: colors.textPrimary }]}
                        placeholder="Code"
                        placeholderTextColor={colors.textTertiary}
                        value={code}
                        onChangeText={setCode}
                        autoCapitalize="characters"
                    />
                </View>

                {/* Empty State */}
                <View style={styles.emptyState}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        No Promotions Available
                    </Text>
                </View>
            </View>

            {/* Button */}
            <View style={[styles.footer, { paddingHorizontal: spacing.screenPadding }]}>
                <TouchableOpacity
                    style={[
                        styles.primaryBtn, 
                        { backgroundColor: code.trim() ? colors.primary : '#E5C687' } // Slightly faded gold if empty
                    ]}
                    activeOpacity={0.85}
                    disabled={!code.trim()}
                >
                    <Text style={[styles.primaryBtnText, { color: colors.textOnPrimary }]}>APPLY</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    iconBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    inputContainer: {
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    input: {
        height: 52,
        fontSize: 16,
        fontWeight: '500',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100, // offset for visual center
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '500',
        opacity: 0.7,
    },
    footer: {
        paddingBottom: 40,
    },
    primaryBtn: {
        width: '100%',
        borderRadius: 999,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtnText: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 1,
    },
});

export default CouponScreen;
