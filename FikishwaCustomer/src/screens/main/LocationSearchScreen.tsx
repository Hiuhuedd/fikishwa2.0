import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    StatusBar, TextInput, ScrollView, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { ChevronLeft, MapPin, Clock, Home, Briefcase, Star } from 'lucide-react-native';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

import { GOOGLE_MAPS_API_KEY } from '../../config/googleMaps';

interface Location {
    label: string;
    address: string;
    lat: number;
    lng: number;
    type: 'recent' | 'popular' | 'search' | 'saved';
    icon?: string;
}

interface GooglePlace {
    name: string;
    formatted_address: string;
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
    };
    place_id: string;
}

const RECENT_SEARCHES: Location[] = [];

const LocationSearchScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { colors, spacing, fontSizes } = useTheme();
    const [pickup, setPickup] = useState(route.params?.currentAddress || 'My current location');
    const [dropoff, setDropoff] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<Location[]>(RECENT_SEARCHES);
    const [searchingField, setSearchingField] = useState<'pickup' | 'dropoff' | null>(null);
    const { user } = useAuthStore();
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    const savedPlacesList: Location[] = (user?.savedPlaces || []).map(p => ({
        label: p.label,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        type: 'saved' as const,
    }));

    const fetchSuggestions = async (text: string) => {
        if (!text || text.length < 3) {
            setSuggestions(RECENT_SEARCHES);
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(
                `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
                {
                    params: {
                        input: text,
                        key: GOOGLE_MAPS_API_KEY,
                        components: 'country:ke', // Restrict to Kenya
                        language: 'en',
                    },
                    timeout: 10000,
                }
            );

            if (response.data.status === 'OK') {
                const googleResults: Location[] = response.data.predictions.map((prediction: any) => ({
                    label: prediction.structured_formatting.main_text,
                    address: prediction.description,
                    lat: 0, // Will be fetched on select
                    lng: 0,
                    placeId: prediction.place_id,
                    type: 'search' as const,
                }));
                setSuggestions(googleResults);
            } else {
                console.warn('Google Places API status:', response.data.status);
                setSuggestions(RECENT_SEARCHES);
            }
        } catch (error: any) {
            console.error("Error fetching Google suggestions:", error.message);
            setSuggestions(RECENT_SEARCHES);
        } finally {
            setLoading(false);
        }
    };

    const handlePickupChange = (text: string) => {
        setPickup(text);
        setSearchingField('pickup');
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            fetchSuggestions(text);
        }, 600); // Increased debounce to 600ms to avoid rate limiting
    };

    const handleDropoffChange = (text: string) => {
        setDropoff(text);
        setSearchingField('dropoff');
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            fetchSuggestions(text);
        }, 600); // Increased debounce to 600ms to avoid rate limiting
    };

    const handleSelectLocation = async (place: any, field: 'pickup' | 'dropoff') => {
        let lat = place.lat;
        let lng = place.lng;

        // If it's a search result from Google, it only has placeId. Fetching coordinates...
        if (place.placeId && (lat === 0 || lng === 0)) {
            setLoading(true);
            try {
                const details = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json`, {
                    params: {
                        place_id: place.placeId,
                        fields: 'geometry',
                        key: GOOGLE_MAPS_API_KEY,
                    }
                });
                if (details.data.status === 'OK') {
                    lat = details.data.result.geometry.location.lat;
                    lng = details.data.result.geometry.location.lng;
                }
            } catch (err) {
                console.error('Error fetching place details:', err);
            } finally {
                setLoading(false);
            }
        }

        if (field === 'pickup') {
            setPickup(place.address || place.label);
            setSearchingField(null);
            setSuggestions(RECENT_SEARCHES);
            // You might want to update the map center here too
        } else {
            setDropoff(place.address || place.label);
            setTimeout(() => {
                navigation.navigate('RideOptions', {
                    pickup: { address: pickup, lat: route.params?.currentLat || -1.2864, lng: route.params?.currentLng || 36.8172 },
                    dropoff: { address: place.address || place.label, lat: lat || -1.2864, lng: lng || 36.8172 },
                });
            }, 300);
        }
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            {/* Input header */}
            <View style={[styles.header, { backgroundColor: colors.backgroundCard, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                    <ChevronLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.inputsColumn}>
                    {/* Pickup */}
                    <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
                        <View style={[styles.dot, { backgroundColor: colors.success }]} />
                        <TextInput
                            style={[styles.input, { color: colors.textPrimary, fontSize: fontSizes.md }]}
                            placeholder="Pickup location"
                            placeholderTextColor={colors.textTertiary}
                            value={pickup}
                            onChangeText={handlePickupChange}
                        />
                    </View>
                    {/* Dropoff */}
                    <View style={styles.inputRow}>
                        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                        <TextInput
                            style={[styles.input, { color: colors.textPrimary, fontSize: fontSizes.md }]}
                            placeholder="Where to?"
                            placeholderTextColor={colors.textTertiary}
                            value={dropoff}
                            onChangeText={handleDropoffChange}
                            autoFocus
                        />
                    </View>
                </View>
            </View>

            {/* Suggestions */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
                {loading && (
                    <View style={{ paddingHorizontal: spacing.screenPadding, paddingTop: 20, alignItems: 'center' }}>
                        <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                )}

                {!loading && suggestions.length === 0 && (searchingField === 'pickup' || searchingField === 'dropoff') && (
                    <View style={{ paddingHorizontal: spacing.screenPadding, paddingTop: 20 }}>
                        <Text style={{ color: colors.textTertiary, fontSize: fontSizes.md, textAlign: 'center' }}>
                            No locations found
                        </Text>
                    </View>
                )}

                {/* Saved Places Section (Visible when not searching or starting to search) */}
                {!loading && suggestions.length === 0 && savedPlacesList.length > 0 && (
                    <View style={{ paddingHorizontal: spacing.screenPadding, paddingTop: 16 }}>
                        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>SAVED PLACES</Text>
                        {savedPlacesList.map((place, i) => (
                            <TouchableOpacity
                                key={`saved-${i}`}
                                style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                                onPress={() => handleSelectLocation(place, searchingField || 'dropoff')}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '10' }]}>
                                    {place.label.toLowerCase() === 'home' ? (
                                        <Home size={18} color={colors.primary} />
                                    ) : place.label.toLowerCase() === 'work' ? (
                                        <Briefcase size={18} color={colors.primary} />
                                    ) : (
                                        <Star size={18} color={colors.primary} />
                                    )}
                                </View>
                                <View style={styles.suggestionContent}>
                                    <Text style={[styles.suggestionLabel, { color: colors.textPrimary }]}>{place.label}</Text>
                                    <Text style={[styles.suggestionAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                                        {place.address}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {!loading && suggestions.length > 0 && (
                    <View style={{ paddingHorizontal: spacing.screenPadding, paddingTop: 16 }}>
                        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
                            {searchingField === 'pickup' ? 'PICKUP LOCATIONS' : searchingField === 'dropoff' ? 'DESTINATIONS' : 'SEARCH RESULTS'}
                        </Text>
                        {suggestions.map((place, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.placeRow, { borderBottomColor: colors.divider }]}
                                onPress={() => handleSelectLocation(place, searchingField || 'dropoff')}
                            >
                                <View style={[styles.placeIcon, { backgroundColor: place.type === 'recent' ? colors.backgroundHover : place.type === 'search' ? colors.primary + '15' : colors.primary + '15' }]}>
                                    {place.type === 'recent'
                                        ? <Clock size={16} color={colors.textSecondary} />
                                        : <MapPin size={16} color={colors.primary} />
                                    }
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.placeName, { color: colors.textPrimary, fontSize: fontSizes.md }]}>{place.label}</Text>
                                    <Text style={{ color: colors.textTertiary, fontSize: fontSizes.sm }}>{place.address}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Confirm button */}
            {dropoff.length > 2 && (
                <View style={[styles.confirmBar, { backgroundColor: colors.backgroundCard }]}>
                    <TouchableOpacity
                        style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                        onPress={() => {
                            navigation.navigate('RideOptions', {
                                pickup: { address: pickup, lat: route.params?.currentLat || -1.2864, lng: route.params?.currentLng || 36.8172 },
                                dropoff: { address: dropoff, lat: -1.3192, lng: 36.9275 },
                            });
                        }}
                    >
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: fontSizes.md }}>Confirm Destination</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        gap: 12, borderBottomWidth: 1,
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 4,
    },
    inputsColumn: { flex: 1 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 10, borderBottomWidth: 1,
    },
    dot: { width: 12, height: 12, borderRadius: 6 },
    input: { flex: 1, fontWeight: '500' },
    sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
    placeRow: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingVertical: 14, borderBottomWidth: 1,
    },
    placeIcon: {
        width: 40, height: 40, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
    },
    placeName: { fontWeight: '600', marginBottom: 2 },
    confirmBar: {
        position: 'absolute', bottom: 40, left: 20, right: 20,
        padding: 16, borderRadius: 24, borderTopWidth: 0,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
    },
    confirmBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    suggestionContent: {
        flex: 1,
    },
    suggestionLabel: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    suggestionAddress: {
        fontSize: 13,
    },
});

export default LocationSearchScreen;
