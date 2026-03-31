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

        // To avoid requiring a complex composite index in Firestore, 
        // we'll fetch all drivers in the geohash range and filter in-memory.
        // This is safe even with hundreds of drivers in a single geohash box (~25 sq km).

        const driversRef = collection(db, 'activeDrivers');
        const q = query(
            driversRef,
            where('geohash', '>=', pickupGeohash),
            where('geohash', '<=', pickupGeohash + '\uf8ff')
        );

        const querySnapshot = await getDocs(q);
        const drivers = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();

            // In-memory filtering
            const isOnline = data.online === true;
            const isNotBusy = data.busy === false;
            const matchesCategory = !requestedCategory || data.currentCategory === requestedCategory;

            if (isOnline && isNotBusy && matchesCategory) {
                drivers.push({ id: doc.id, ...data });
            }
        });

        // Optional: Manual distance filtering if higher precision is needed
        return drivers;
    } catch (error) {
        console.error('Matching Service Error:', error);
        throw error;
    }
};

/**
 * Find nearby pending ride requests
 * @param {object} location - { lat, lng }
 * @param {string} category - driver's current vehicle category
 */
const findNearbyRequests = async (location, category = 'standard') => {
    try {
        const geohash = ngeohash.encode(location.lat, location.lng, 5);
        console.log(`🔍 [Matching] DISCOVERY: Searching near ${geohash} for category: ${category}`);
        
        const requestRef = collection(db, 'rideRequests');
        const q = query(
            requestRef,
            where('geohash', '>=', geohash),
            where('geohash', '<=', geohash + '\uf8ff')
        );

        const snapshot = await getDocs(q);
        const requests = [];

        console.log(`🔍 [Matching] DISCOVERY: Found ${snapshot.size} area matches.`);

        snapshot.forEach(doc => {
            const data = doc.data();
            const reqCategory = data.vehicleCategory || data.rideType || 'standard';
            const isActive = data.status === 'pending';
            const isMatch = reqCategory === category && isActive;
            
            console.log(`   - [${isMatch ? 'MATCH' : 'SKIP'}] Request ${doc.id}: Status=${data.status}, RequestCat=${reqCategory}, DriverCat=${category}, Geohash=${data.geohash}`);
            
            if (isMatch) {
                requests.push({ id: doc.id, ...data });
            }
        });

        // If no strict category match, but we have requests, log it clearly for debugging
        if (requests.length === 0 && snapshot.size > 0) {
            console.log(`⚠️ [Matching] DISCOVERY: Nearby requests found but NONE matched the driver's category (${category}).`);
        }

        return requests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    } catch (error) {
        console.error('Find Nearby Requests Error:', error);
        throw error;
    }
};

module.exports = {
    findNearbyDrivers,
    findNearbyRequests
};
