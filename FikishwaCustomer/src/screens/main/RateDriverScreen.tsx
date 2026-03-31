import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    StatusBar, Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import api from '../../services/api';
import customerApiService from '../../services/customerApiService';
import { API_ENDPOINTS } from '../../config/api';
import { Star } from 'lucide-react-native';



const RateDriverScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { rideId, driver, estimatedFare } = route.params || {};
    const { colors, fontSizes, spacing } = useTheme();

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await customerApiService.rateDriver({ rideId, stars: rating, comment });
            navigation.replace('Home');
        } catch {
            Alert.alert('Error', 'Failed to submit rating.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" />
            <View style={[styles.content, { paddingHorizontal: spacing.screenPadding }]}>
                {/* Success mark */}
                <Text style={styles.emoji}>🎉</Text>
                <Text style={[styles.title, { color: colors.textPrimary }]}>You've arrived!</Text>
                <Text style={[styles.sub, { color: colors.textSecondary, fontSize: fontSizes.md }]}>
                    How was your ride with{' '}
                    <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{driver?.name || 'your driver'}</Text>?
                </Text>

                {/* Star rating */}
                <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <TouchableOpacity key={s} onPress={() => setRating(s)} activeOpacity={0.8}>
                            <Star
                                size={42}
                                color={s <= rating ? '#F59E0B' : colors.border}
                                fill={s <= rating ? '#F59E0B' : 'transparent'}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Review Comment */}
                <View style={styles.commentContainer}>
                    <Text style={[styles.commentLabel, { color: colors.textSecondary }]}>Write a review (optional)</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: colors.backgroundCard,
                            color: colors.textPrimary,
                            borderColor: colors.border
                        }]}
                        placeholder="Tell us about your experience..."
                        placeholderTextColor={colors.textTertiary}
                        multiline
                        numberOfLines={4}
                        value={comment}
                        onChangeText={setComment}
                    />
                </View>

                {/* Submit */}
                <TouchableOpacity
                    style={[styles.btn, { backgroundColor: colors.primary }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Done</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.replace('Home')} style={{ marginTop: 12 }}>
                    <Text style={{ color: colors.textTertiary, textAlign: 'center', fontSize: fontSizes.sm }}>Skip for now</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emoji: { fontSize: 64, marginBottom: 16 },
    title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 10 },
    sub: { textAlign: 'center', marginBottom: 32 },
    starsRow: { flexDirection: 'row', gap: 8, marginBottom: 36 },
    commentContainer: { width: '100%', marginBottom: 32 },
    commentLabel: { fontSize: 13, fontWeight: '600', marginBottom: 12, letterSpacing: 0.5 },
    input: {
        width: '100%',
        height: 100,
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        textAlignVertical: 'top',
    },
    btn: {
        width: '100%', borderRadius: 16, paddingVertical: 17, alignItems: 'center',
        shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
    },
    btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

export default RateDriverScreen;
