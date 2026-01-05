
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { locationService } from '../services/locationService';
import { MAPBOX_STYLE_URL } from '../config';

const MapTestScreen = () => {
    const [locationPermission, setLocationPermission] = useState(false);

    useEffect(() => {
        requestPermission();
    }, []);

    const requestPermission = async () => {
        const granted = await locationService.requestLocationPermission();
        setLocationPermission(granted);
    };

    return (
        <View style={styles.container}>
            <Mapbox.MapView style={styles.map} styleURL={MAPBOX_STYLE_URL}>
                <Mapbox.Camera
                    zoomLevel={14}
                    followUserLocation
                    followUserMode={Mapbox.UserTrackingMode.Follow}
                />
                <Mapbox.UserLocation animated={true} />
            </Mapbox.MapView>

            <View style={styles.overlay}>
                <Text style={styles.text}>Mapbox Integration Test</Text>
                <Text style={styles.status}>
                    Permission: {locationPermission ? 'GRANTED' : 'DENIED'}
                </Text>
                {!locationPermission && (
                    <TouchableOpacity style={styles.button} onPress={requestPermission}>
                        <Text style={styles.buttonText}>Request Permission</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    overlay: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 15,
        borderRadius: 10,
    },
    text: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    status: {
        color: '#ccc',
        fontSize: 14,
    },
    button: {
        marginTop: 10,
        backgroundColor: '#1DB954',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default MapTestScreen;
