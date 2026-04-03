import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    StatusBar, Image, Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';

const { width } = Dimensions.get('window');

const WelcomeScreen = () => {
    const navigation = useNavigation<any>();
    const { colors, spacing, fontSizes } = useTheme();

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            <View style={styles.content}>
                {/* Illustration */}
                <View style={styles.imageContainer}>
                    <Image
                        source={require('../../assets/images/welcome_illustration.png')}
                        style={styles.image}
                        resizeMode="contain"
                    />
                </View>

                {/* Text Content */}
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>Premium Ride Experience</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Elegance and comfort at your fingertips. Discover the new standard of e-hailing with Fikishwa.
                    </Text>
                </View>
            </View>

            {/* Buttons */}
            <View style={[styles.footer, { paddingHorizontal: spacing.screenPadding }]}>
                <TouchableOpacity
                    style={[styles.outlineBtn, { borderColor: colors.primary }]}
                    onPress={() => navigation.navigate('Register')}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.outlineBtnText, { color: colors.primary }]}>Register</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                    onPress={() => navigation.navigate('PhoneLogin')}
                    activeOpacity={0.85}
                >
                    <Text style={[styles.primaryBtnText, { color: colors.textOnPrimary }]}>Sign in</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    imageContainer: {
        width: width * 0.8,
        height: width * 0.6,
        marginBottom: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.7,
    },
    footer: {
        paddingBottom: 70,
        gap: 16,
        flexDirection: 'row',
    },
    primaryBtn: {
        flex: 1,
        borderRadius: 999, // Pill shape
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtnText: {
        fontSize: 18,
        fontWeight: '700',
    },
    outlineBtn: {
        flex: 1,
        borderRadius: 999, // Pill shape
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
    },
    outlineBtnText: {
        fontSize: 18,
        fontWeight: '700',
    },
});

export default WelcomeScreen;
