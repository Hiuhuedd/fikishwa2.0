const { getFirestoreApp } = require('../firebase');
const { collection, query, where, getDocs } = require('firebase/firestore');
const ngeohash = require('ngeohash');
const configService = require('./configService');

const db = getFirestoreApp();

/**
 * Calculate Haversine distance between two points in km
 */
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
};

/**
 * Find nearby available drivers
 * @param {object} pickup - { lat, lng }
 * @param {number} radiusKm - search radius
 */
const findNearbyDrivers = async (pickup, radiusKm = 10, requestedCategory = null, includeOffline = false) => {
    try {
        const config = await configService.getConfig();
        const maxDispatchRadius = config.maxDispatchRadius || null;
        const geohashPrecision = config.geohashPrecision || 5;

        const pickupGeohash = ngeohash.encode(pickup.lat, pickup.lng, geohashPrecision);
        const driversRef = collection(db, 'activeDrivers');
        const queryPromises = [];

        if (maxDispatchRadius && maxDispatchRadius > 0) {
            // Query 9 surrounding geohashes to ensure we cover the boundary
            const neighbors = ngeohash.neighbors(pickupGeohash);
            const geohashesToQuery = [pickupGeohash, ...neighbors];
            
            console.log(`🔍 [Matching] findNearbyDrivers: Querying 9 geohashes around ${pickupGeohash} with radius ${maxDispatchRadius}km`);
            
            for (const hash of geohashesToQuery) {
                const q = query(
                    driversRef,
                    where('geohash', '>=', hash),
                    where('geohash', '<=', hash + '\uf8ff')
                );
                queryPromises.push(getDocs(q));
            }
        } else {
            // Default legacy behavior: single box match
            console.log(`🔍 [Matching] findNearbyDrivers: Querying single geohash ${pickupGeohash}`);
            const q = query(
                driversRef,
                where('geohash', '>=', pickupGeohash),
                where('geohash', '<=', pickupGeohash + '\uf8ff')
            );
            queryPromises.push(getDocs(q));
        }

        const snapshots = await Promise.all(queryPromises);
        const driverMap = new Map();
        
        let totalDocs = 0;
        snapshots.forEach(snapshot => {
            totalDocs += snapshot.size;
            snapshot.forEach(doc => {
                driverMap.set(doc.id, doc.data());
            });
        });

        console.log(`🔍 [Matching] findNearbyDrivers: Found ${totalDocs} total docs, ${driverMap.size} unique active drivers`);

        const drivers = [];

        driverMap.forEach((data, id) => {
            // In-memory filtering
            const isOnline = data.online === true;
            const isNotBusy = data.busy === false;
            const driverCategory = (data.currentCategory || 'fikaa').toString().trim();
            const requestedCatTrimmed = (requestedCategory || '').toString().trim();
            const matchesCategory = !requestedCategory || driverCategory === requestedCatTrimmed;
            const notificationsEnabled = data.receiveOfflineNotifications !== false;

            if ((isOnline || (includeOffline && notificationsEnabled)) && isNotBusy && matchesCategory) {
                if (maxDispatchRadius && maxDispatchRadius > 0 && data.currentLocation) {
                    const distance = getDistance(pickup.lat, pickup.lng, data.currentLocation.lat, data.currentLocation.lng);
                    if (distance <= maxDispatchRadius) {
                        drivers.push({ id, ...data, distance });
                        console.log(`   - Driver ${id}: MATCH (dist: ${distance.toFixed(2)}km <= ${maxDispatchRadius}km, cat=${driverCategory}, online=${isOnline})`);
                    } else {
                        console.log(`   - Driver ${id}: SKIP (dist: ${distance.toFixed(2)}km > ${maxDispatchRadius}km)`);
                    }
                } else {
                    drivers.push({ id, ...data });
                    console.log(`   - Driver ${id}: MATCH (cat=${driverCategory}, online=${isOnline}, dist: N/A)`);
                }
            }
        });

        console.log(`✅ [Matching] findNearbyDrivers: Returning ${drivers.length} matched drivers`);
        
        // Sort by distance if calculated
        if (maxDispatchRadius && maxDispatchRadius > 0) {
            drivers.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }
        
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
        const config = await configService.getConfig();
        const maxDispatchRadius = config.maxDispatchRadius || null;
        const geohashPrecision = config.geohashPrecision || 5;
        
        const geohash = ngeohash.encode(location.lat, location.lng, geohashPrecision);
        const requestRef = collection(db, 'rideRequests');
        const queryPromises = [];

        if (maxDispatchRadius && maxDispatchRadius > 0) {
            const neighbors = ngeohash.neighbors(geohash);
            const geohashesToQuery = [geohash, ...neighbors];
            
            console.log(`🔍 [Matching] DISCOVERY: Querying 9 geohashes around ${geohash} for category: ${category}`);
            
            for (const hash of geohashesToQuery) {
                const q = query(
                    requestRef,
                    where('geohash', '>=', hash),
                    where('geohash', '<=', hash + '\uf8ff')
                );
                queryPromises.push(getDocs(q));
            }
        } else {
            console.log(`🔍 [Matching] DISCOVERY: Searching near ${geohash} for category: ${category}`);
            const q = query(
                requestRef,
                where('geohash', '>=', geohash),
                where('geohash', '<=', geohash + '\uf8ff')
            );
            queryPromises.push(getDocs(q));
        }

        const snapshots = await Promise.all(queryPromises);
        const requestMap = new Map();

        snapshots.forEach(snapshot => {
            snapshot.forEach(doc => {
                requestMap.set(doc.id, doc.data());
            });
        });

        console.log(`🔍 [Matching] DISCOVERY: Found ${requestMap.size} unique area matches.`);

        const requests = [];

        requestMap.forEach((data, id) => {
            const reqCategory = data.vehicleCategory || data.rideType || 'standard';
            const isActive = data.status === 'pending' || !data.status; // rideRequests collection only contains pending requests anyway
            const isMatch = reqCategory === category && isActive;

            if (isMatch) {
                if (maxDispatchRadius && maxDispatchRadius > 0 && data.pickup) {
                    const distance = getDistance(location.lat, location.lng, data.pickup.lat, data.pickup.lng);
                    if (distance <= maxDispatchRadius) {
                        requests.push({ id, ...data, distance });
                        console.log(`   - [MATCH] Request ${id}: (dist: ${distance.toFixed(2)}km <= ${maxDispatchRadius}km)`);
                    } else {
                        console.log(`   - [SKIP] Request ${id}: (dist: ${distance.toFixed(2)}km > ${maxDispatchRadius}km)`);
                    }
                } else {
                    requests.push({ id, ...data });
                    console.log(`   - [MATCH] Request ${id}: (dist: N/A)`);
                }
            } else {
                 console.log(`   - [SKIP] Request ${id}: RequestCat=${reqCategory}, DriverCat=${category}`);
            }
        });

        if (requests.length === 0 && requestMap.size > 0) {
            console.log(`⚠️ [Matching] DISCOVERY: Nearby requests found but NONE matched criteria.`);
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
