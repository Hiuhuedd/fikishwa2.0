import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    StatusBar, Image, Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

const SuccessScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { colors, spacing } = useTheme();
    const { login } = useAuthStore();
    const { token, userProfile } = route.params || {};

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            <View style={styles.content}>
                {/* Illustration */}
                <View style={styles.imageContainer}>
                    <Image
                        source={require('../../assets/images/success_illustration.jpg')}
                        style={styles.image}
                        resizeMode="contain"
                    />
                </View>

                {/* Text Content */}
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>
                        Thanks you for Registering with us.
                    </Text>
                </View>
            </View>

            {/* Button */}
            <View style={[styles.footer, { paddingHorizontal: spacing.screenPadding }]}>
                <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                    onPress={async () => {
                        if (token && userProfile) {
                            await login(token, userProfile);
                        } else {
                            // Fallback if accessed without params
                            navigation.replace('Home');
                        }
                    }}
                    activeOpacity={0.85}
                >
                    <Text style={[styles.primaryBtnText, { color: colors.textOnPrimary }]}>GET STARTED</Text>
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
        width: width * 0.7,
        height: width * 0.7,
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
        fontSize: 26,
        fontWeight: '800',
        textAlign: 'center',
        lineHeight: 34,
    },
    footer: {
        paddingBottom: 40,
    },
    primaryBtn: {
        width: '100%',
        borderRadius: 999, // Pill shape
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtnText: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});

export default SuccessScreen;
