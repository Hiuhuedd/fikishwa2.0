const { getFirestoreApp } = require('../firebase');
const { doc, getDoc, updateDoc, serverTimestamp, setDoc, deleteDoc } = require('firebase/firestore');
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
        // Strict Onboarding Gating
        const driverRef = doc(db, 'drivers', driverId);
        const driverDoc = await getDoc(driverRef);

        if (!driverDoc.exists()) {
            return res.status(404).json({ success: false, error: 'Driver not found' });
        }

        const data = driverDoc.data();
        if (data.registrationStatus !== 'approved') {
            return res.status(403).json({
                success: false,
                error: 'FORBIDDEN',
                message: 'Your account is under review or not yet approved. You cannot go online.'
            });
        }

        // Use the driver's primary vehicleType or their first approved category
        let category = data.vehicleType || (data.approvedCategories && data.approvedCategories.length > 0 ? data.approvedCategories[0] : 'standard');

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

        // 2. Look for existing pending requests nearby for this category
        const matchingService = require('../services/matchingService');
        const pendingRequests = await matchingService.findNearbyRequests(location, category);
        const pendingRequest = pendingRequests.length > 0 ? pendingRequests[0] : null;

        console.log(`📡 [GoOnline] Discovery check: Found ${pendingRequests.length} requests. Selected: ${pendingRequest ? pendingRequest.id : 'None'}`);

        res.json({
            success: true,
            message: 'Driver is now online',
            currentCategory: category,
            pendingRequest: pendingRequest // Return pending request if found
        });
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

    try {
        const driverRef = doc(db, 'drivers', driverId);
        const driverSnap = await getDoc(driverRef);
        const driverData = driverSnap.data() || {};

        console.log(`🚕 [AcceptRide] Fetching details for driver: ${driverId}`);
        console.log(`🚕 [AcceptRide] Raw Driver Data from DB:`, JSON.stringify(driverData));

        const driverDetails = {
            name: driverData.name || req.user.name || 'Driver',
            phone: driverData.phone || req.user.phone,
            rating: driverData.rating || 4.8,
            vehicleMake: driverData.carMake || '',
            vehicleModel: driverData.carModel || '',
            plateNumber: driverData.plateNumber || '',
            carImageUrl: driverData.carImageUrl || null,
            vehicleColor: driverData.vehicleColor || '#4CD964'
        };

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
 * Update ride status (arrived, etc.)
 */
exports.updateStatus = async (req, res) => {
    const { rideId, status } = req.body;
    try {
        const ride = await rideService.updateRideStatus(rideId, status);
        res.json({ success: true, ride });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
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
 * Confirm payment received
 */
exports.confirmPayment = async (req, res) => {
    const { rideId } = req.body;
    const driverId = req.user.uid;

    try {
        const { doc, getDoc, updateDoc } = require('firebase/firestore');
        const db = getFirestoreApp();
        const rideRef = doc(db, 'rides', rideId);
        const rideSnap = await getDoc(rideRef);

        if (!rideSnap.exists()) {
            return res.status(404).json({ error: 'Ride not found' });
        }

        const rideData = rideSnap.data();
        if (rideData.driverId !== driverId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await updateDoc(rideRef, {
            paymentStatus: 'paid',
            paidAt: serverTimestamp()
        });

        // Notify customer
        const socketService = require('../services/socketService');
        socketService.emitToUser(rideData.customerId, 'payment-confirmed', {
            rideId,
            status: 'paid'
        });

        res.json({ success: true, message: 'Payment confirmed' });
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
 * Get full ride history for driver
 */
exports.getRideHistory = async (req, res) => {
    // For now, we reuse getRecentRides logic but ensure it's mapped to the correct frontend expected path
    return exports.getRecentRides(req, res);
};

/**
 * Get current active ride for driver
 */
exports.getActiveRide = async (req, res) => {
    const driverId = req.user.uid;
    try {
        const { collection, query, where, getDocs, limit } = require('firebase/firestore');
        const db = getFirestoreApp();
        const ridesRef = collection(db, 'rides');
        // Include 'searching' as a fallback active state for the driver
        const statuses = ['accepted', 'arriving', 'arrived', 'in_progress', 'picking_up'];

        const q = query(
            ridesRef,
            where('driverId', '==', driverId),
            where('status', 'in', statuses),
            limit(1)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return res.json({ success: true, ride: null });
        }

        const rideDoc = snapshot.docs[0];
        res.json({ success: true, ride: { rideId: rideDoc.id, ...rideDoc.data() } });
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
/**
 * Cancel ride
 */
exports.cancelRide = async (req, res) => {
    const { rideId, reason } = req.body;
    const driverId = req.user.uid;

    if (!rideId) {
        return res.status(400).json({ error: 'Ride ID is required' });
    }

    try {
        const ride = await rideService.updateRideStatus(rideId, 'cancelled', {
            cancelledBy: 'driver',
            cancellationReason: reason || 'Driver cancelled',
            cancelledAt: serverTimestamp()
        });

        // Also mark driver as free
        await updateDoc(doc(db, 'activeDrivers', driverId), {
            busy: false
        });

        res.json({ success: true, ride });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
