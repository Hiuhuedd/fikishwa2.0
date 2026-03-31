const axios = require('axios');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Forward geocoding: Get coordinates from address query (Google Maps)
 */
const forwardGeocode = async (query) => {
    try {
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`
        );

        if (response.data.status !== 'OK') {
            return [];
        }

        return response.data.results.map(result => ({
            id: result.place_id,
            address: result.formatted_address,
            coordinates: {
                lng: result.geometry.location.lng,
                lat: result.geometry.location.lat
            }
        }));
    } catch (error) {
        console.error('Google Maps Geocoding Error:', error);
        throw error;
    }
};

/**
 * Calculate route with optional waypoints (Google Maps)
 */
const getRoute = async (pickup, stops = [], dropoff) => {
    try {
        const origin = `${pickup.lat},${pickup.lng}`;
        const destination = `${dropoff.lat},${dropoff.lng}`;
        let waypoints = '';
        if (stops.length > 0) {
            waypoints = '&waypoints=' + stops.map(s => `${s.lat},${s.lng}`).join('|');
        }

        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${waypoints}&key=${GOOGLE_MAPS_API_KEY}`
        );

        if (response.data.status !== 'OK') {
            throw new Error(`Directions API error: ${response.data.status}`);
        }

        const route = response.data.routes[0];
        const leg = route.legs[0]; // For simplicity, though multi-leg routes exist

        // Total distance and duration across all legs
        let totalDistance = 0;
        let totalDuration = 0;
        route.legs.forEach(l => {
            totalDistance += l.distance.value;
            totalDuration += l.duration.value;
        });

        return {
            distance: totalDistance, // meters
            duration: totalDuration, // seconds
            geometry: route.overview_polyline.points,
            waypoints: route.legs.map(l => ({
                distance: l.distance.value,
                duration: l.duration.value,
                summary: route.summary,
                location: [l.start_location.lng, l.start_location.lat]
            }))
        };
    } catch (error) {
        console.error('Google Maps Directions Error:', error);
        throw error;
    }
};

module.exports = {
    forwardGeocode,
    getRoute
};
