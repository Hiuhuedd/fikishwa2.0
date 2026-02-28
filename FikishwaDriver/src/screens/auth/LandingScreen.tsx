import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, FontSizes } from '../../theme';

const LandingScreen = () => {
    const navigation = useNavigation<any>();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    {/* Placeholder for Logo */}
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoText}>F</Text>
                    </View>
                    <Text style={styles.title}>Fikishwa Driver</Text>
                    <Text style={styles.subtitle}>Drive when you want, earn what you need.</Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.primaryButtonText}>Sign In / Sign Up</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => { /* Possible info link */ }}
                    >
                        <Text style={styles.secondaryButtonText}>Learn More</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>© 2026 Fikishwa Logistics</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        padding: Spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 60,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    logoText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: Colors.white,
    },
    title: {
        fontSize: FontSizes.xxxl,
        fontWeight: 'bold',
        color: Colors.white,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: Spacing.lg,
    },
    buttonContainer: {
        width: '100%',
        gap: Spacing.md,
    },
    primaryButton: {
        backgroundColor: Colors.primary,
        padding: Spacing.md,
        borderRadius: 30,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: Colors.white,
        fontSize: FontSizes.md,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        padding: Spacing.md,
        borderRadius: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    secondaryButtonText: {
        color: Colors.white,
        fontSize: FontSizes.md,
    },
    footer: {
        padding: Spacing.lg,
        alignItems: 'center',
    },
    footerText: {
        color: Colors.textTertiary,
        fontSize: FontSizes.xs,
    },
});

export default LandingScreen;
