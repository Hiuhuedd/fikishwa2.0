const { getFirestoreApp } = require('../firebase');
const { collection, query, where, getDocs } = require('firebase/firestore');
const ngeohash = require('ngeohash');

const db = getFirestoreApp();

/**
 * Find nearby available drivers
 * @param {object} pickup - { lat, lng }
 * @param {number} radiusKm - search radius
 */
const findNearbyDrivers = async (pickup, radiusKm = 10, requestedCategory = null) => {
    try {
        // Simple geohash matching: 
        // 5 characters = ~4.9km x 4.9km
        // 6 characters = ~1.2km x 0.6km
        // We'll use 5 chars for a rough 10km radius search (actually includes more)
        const pickupGeohash = ngeohash.encode(pickup.lat, pickup.lng, 5);

        // In a real production app, we would use geohash range queries (startAt/endAt)
        // or a dedicated spatial query tool like GeoFirestore.
        // For this implementation, we search for drivers in the same 5-char geohash box.

        const driversRef = collection(db, 'activeDrivers');

        let constraints = [
            where('online', '==', true),
            where('busy', '==', false),
            where('geohash', '>=', pickupGeohash),
            where('geohash', '<=', pickupGeohash + '\uf8ff')
        ];

        // Filter by category if specified
        if (requestedCategory) {
            constraints.push(where('currentCategory', '==', requestedCategory));
        }

        const q = query(driversRef, ...constraints);

        const querySnapshot = await getDocs(q);
        const drivers = [];
        querySnapshot.forEach((doc) => {
            drivers.push({ id: doc.id, ...doc.data() });
        });

        // Optional: Manual distance filtering if higher precision is needed
        // but for now, matching by geohash prefix is enough for the core flow.

        return drivers;
    } catch (error) {
        console.error('Matching Service Error:', error);
        throw error;
    }
};

module.exports = {
    findNearbyDrivers
};
