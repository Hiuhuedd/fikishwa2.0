const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mbxDirections = require('@mapbox/mapbox-sdk/services/directions');

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

const geocodingClient = mbxGeocoding({ accessToken: MAPBOX_ACCESS_TOKEN });
const directionsClient = mbxDirections({ accessToken: MAPBOX_ACCESS_TOKEN });

/**
 * Forward geocoding: Get coordinates from address query
 */
const forwardGeocode = async (query) => {
    try {
        const response = await geocodingClient.forwardGeocode({
            query: query,
            limit: 5,
            countries: ['ke'] // Focused on Kenya
        }).send();

        return response.body.features.map(feature => ({
            id: feature.id,
            address: feature.place_name,
            coordinates: {
                lng: feature.center[0],
                lat: feature.center[1]
            }
        }));
    } catch (error) {
        console.error('Mapbox Geocoding Error:', error);
        throw error;
    }
};

/**
 * Calculate route with optional waypoints
 */
const getRoute = async (pickup, stops = [], dropoff) => {
    try {
        // Build waypoints array from pickup, stops, and dropoff
        const waypoints = [
            { coordinates: [pickup.lng, pickup.lat] },
            ...stops.map(stop => ({ coordinates: [stop.lng, stop.lat] })),
            { coordinates: [dropoff.lng, dropoff.lat] }
        ];

        const response = await directionsClient.getDirections({
            profile: 'driving',
            waypoints: waypoints,
            geometries: 'polyline',
            overview: 'full'
        }).send();

        if (!response.body.routes || response.body.routes.length === 0) {
            throw new Error('No route found');
        }

        const route = response.body.routes[0];

        return {
            distance: route.distance, // meters
            duration: route.duration, // seconds
            geometry: route.geometry, // polyline
            waypoints: route.legs.map((leg, index) => ({
                distance: leg.distance,
                duration: leg.duration,
                summary: leg.summary,
                // The directions API might have slightly adjusted coordinates
                location: waypoints[index].coordinates
            }))
        };
    } catch (error) {
        console.error('Mapbox Directions Error:', error);
        throw error;
    }
};

module.exports = {
    forwardGeocode,
    getRoute
};
