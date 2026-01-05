const { getFirestoreApp } = require('../firebase');
const { doc, updateDoc, serverTimestamp, setDoc, deleteDoc } = require('firebase/firestore');
const rideService = require('../services/rideService');
const fareService = require('../services/fareService');
const ngeohash = require('ngeohash');

const db = getFirestoreApp();

/**
 * Go online
 */
exports.goOnline = async (req, res) => {
    const { location, selectedCategory } = req.body;
    const driverId = req.user.uid;

    if (!location || !location.lat || !location.lng) {
        return res.status(400).json({ error: 'Valid location is required' });
    }

    try {
        // Validate category selection
        // In a real app we would check if selectedCategory is in driver's approvedCategories
        // For now we trust or default to 'standard'

        let category = selectedCategory || 'standard';

        const geohash = ngeohash.encode(location.lat, location.lng, 6);
        await setDoc(doc(db, 'activeDrivers', driverId), {
            driverId,
            online: true,
            busy: false,
            currentLocation: location,
            currentCategory: category, // Save current vehicle category
            geohash,
            lastSeenAt: serverTimestamp()
        });

        res.json({ success: true, message: 'Driver is now online', currentCategory: category });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Go offline
 */
exports.goOffline = async (req, res) => {
    const driverId = req.user.uid;

    try {
        await updateDoc(doc(db, 'activeDrivers', driverId), {
            online: false,
            updatedAt: serverTimestamp()
        });
        // Alternatively, delete from active pool
        // await deleteDoc(doc(db, 'activeDrivers', driverId));

        res.json({ success: true, message: 'Driver is now offline' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Accept ride
 */
exports.acceptRide = async (req, res) => {
    const { rideId } = req.body;
    const driverId = req.user.uid;
    const driverDetails = {
        name: req.user.name || 'Driver',
        phone: req.user.phone,
        // photo: req.user.photo
    };

    try {
        const ride = await rideService.acceptRide(rideId, driverId, driverDetails);

        // Also mark driver as busy
        await updateDoc(doc(db, 'activeDrivers', driverId), {
            busy: true
        });

        res.json({ success: true, ride });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

/**
 * Start ride
 */
exports.startRide = async (req, res) => {
    const { rideId } = req.body;

    try {
        const ride = await rideService.updateRideStatus(rideId, 'in_progress', {
            startedAt: serverTimestamp()
        });
        res.json({ success: true, ride });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Complete ride
 */
exports.completeRide = async (req, res) => {
    const { rideId, actualDistanceKm, actualDurationMin } = req.body;
    const driverId = req.user.uid;

    if (!actualDistanceKm || !actualDurationMin) {
        return res.status(400).json({ error: 'Actual distance and duration are required' });
    }

    try {
        const ride = await rideService.completeRide(rideId, driverId, actualDistanceKm, actualDurationMin);

        // Mark driver as free
        await updateDoc(doc(db, 'activeDrivers', driverId), {
            busy: false
        });

        res.json({ success: true, ride });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Rate customer (optional)
 */
exports.rateCustomer = async (req, res) => {
    const { rideId, stars, comment } = req.body;
    const driverId = req.user.uid;

    if (!stars || stars < 1 || stars > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    try {
        const ratingService = require('../services/ratingService');
        const result = await ratingService.submitDriverRating(rideId, driverId, stars, comment || '');

        // Emit socket event to customer
        const socketService = require('../services/socketService');
        socketService.emitToUser(result.customerId, 'rating-received', {
            rideId,
            stars,
            comment
        });

        res.json({ success: true, message: 'Customer rated successfully' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

/**
 * Get recent rides with earnings
 */
exports.getRecentRides = async (req, res) => {
    const driverId = req.user.uid;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const { collection, query, where, orderBy, limit: firestoreLimit, getDocs } = require('firebase/firestore');

        const ridesRef = collection(db, 'rides');
        const q = query(
            ridesRef,
            where('driverId', '==', driverId),
            where('status', '==', 'completed'),
            orderBy('completedAt', 'desc'),
            firestoreLimit(limit)
        );

        const snapshot = await getDocs(q);
        const rides = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            rides.push({
                rideId: doc.id,
                date: data.completedAt,
                pickup: data.pickup.address,
                dropoff: data.dropoff.address,
                distance: data.actualDistanceKm || data.distanceKm,
                duration: data.actualDurationMin || data.durationMin,
                fare: data.finalFare || data.estimatedFare,
                earnings: (data.finalFare || data.estimatedFare) * 0.97,
                customerRating: data.customerRating?.stars || null,
                ratingComment: data.customerRating?.comment || null
            });
        });

        res.json({ success: true, rides });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get driver's approved categories
 */
exports.getAvailableCategories = async (req, res) => {
    try {
        const { getFirestoreApp } = require('../firebase');
        const db = getFirestoreApp();
        const { doc, getDoc } = require('firebase/firestore');
        const vehicleCategoryService = require('../services/vehicleCategoryService');

        const driverId = req.user.uid;
        const driverDoc = await getDoc(doc(db, 'drivers', driverId));

        if (!driverDoc.exists()) {
            return res.status(404).json({ success: false, message: 'Driver profile not found' });
        }

        const data = driverDoc.data();
        const approvedIds = data.approvedCategories || ['standard']; // Default

        const allCategories = await vehicleCategoryService.getActiveCategories();

        // Filter and enrich
        const available = allCategories.filter(cat => approvedIds.includes(cat.categoryId));

        res.json({ success: true, categories: available });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
