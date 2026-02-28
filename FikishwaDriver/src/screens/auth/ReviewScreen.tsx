import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Colors, Spacing, FontSizes } from '../../theme';
import { useAuthStore } from '../../store/authStore';

const ReviewScreen = () => {
    const { logout } = useAuthStore();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconCircle}>
                    <Text style={styles.icon}>🕒</Text>
                </View>
                <Text style={styles.title}>Application Under Review</Text>
                <Text style={styles.subtitle}>
                    Our team is currently reviewing your documents. This usually takes 24-48 hours.
                    We'll notify you once you're approved to start driving!
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={logout}
                >
                    <Text style={styles.buttonText}>Log Out</Text>
                </TouchableOpacity>
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
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.backgroundLighter,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    icon: {
        fontSize: 48,
    },
    title: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
        color: Colors.white,
        marginBottom: Spacing.md,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FontSizes.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    button: {
        padding: Spacing.md,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: Colors.textSecondary,
        fontSize: FontSizes.md,
    },
});

export default ReviewScreen;
