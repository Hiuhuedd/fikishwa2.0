const geoService = require('../services/geoService');
const rideService = require('../services/rideService');
const fareService = require('../services/fareService');

/**
 * Handle location autocomplete
 */
exports.searchLocation = async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    try {
        const locations = await geoService.forwardGeocode(query);
        res.json({ success: true, locations });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get fare estimate
 */
exports.getEstimate = async (req, res) => {
    const { pickup, stops, dropoff, rideType, promoCode, vehicleCategory } = req.body;
    const userId = req.user.uid;

    if (!pickup || !dropoff) {
        return res.status(400).json({ error: 'Pickup and dropoff are required' });
    }

    try {
        const routeData = await geoService.getRoute(pickup, stops || [], dropoff);
        const estimate = await fareService.calculateEstimate(
            routeData.distance,
            routeData.duration,
            (stops || []).length,
            rideType,
            promoCode,
            userId,
            vehicleCategory // Pass selected category
        );

        res.json({
            success: true,
            ...estimate,
            routePolyline: routeData.geometry,
            stopCount: (stops || []).length
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Request a ride
 */
exports.requestRide = async (req, res) => {
    const { pickup, stops, dropoff, rideType, paymentMethod, promoCode, vehicleCategory } = req.body;
    const customerId = req.user.uid; // Assuming auth middleware attaches user
    const customerName = req.user.name || 'Customer';

    if (!pickup || !dropoff) {
        return res.status(400).json({ error: 'Pickup and dropoff are required' });
    }

    try {
        const ride = await rideService.requestRide({
            customerId,
            customerName,
            pickup,
            stops: stops || [],
            dropoff,
            rideType,
            paymentMethod,
            promoCode,        // Pass promo code
            vehicleCategory   // Pass vehicle category
        });

        res.json({ success: true, ride });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Cancel a ride
 */
exports.cancelRide = async (req, res) => {
    const { rideId, reason } = req.body;
    const customerId = req.user.uid;

    if (!reason) {
        return res.status(400).json({ error: 'Cancellation reason is required' });
    }

    try {
        const result = await rideService.updateRideStatus(rideId, 'cancelled', {
            cancelledBy: 'customer',
            cancellationReason: reason,
            cancelledAt: new Date().toISOString()
        });
        res.json({ success: true, ride: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Rate driver
 */
exports.rateDriver = async (req, res) => {
    const { rideId, stars, comment } = req.body;
    const customerId = req.user.uid;

    if (!stars || stars < 1 || stars > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    try {
        const ratingService = require('../services/ratingService');
        const result = await ratingService.submitCustomerRating(rideId, customerId, stars, comment || '');

        // Emit socket event to driver
        const socketService = require('../services/socketService');
        socketService.emitToUser(result.driverId, 'rating-received', {
            rideId,
            stars,
            comment,
            newAverage: result.newAverage,
            totalRatings: result.totalRatings
        });

        res.json({ success: true, message: 'Driver rated successfully' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

/**
 * Get ride history
 */
exports.getRideHistory = async (req, res) => {
    const customerId = req.user.uid;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    try {
        const { getFirestoreApp } = require('../firebase');
        const { collection, query, where, orderBy, limit: firestoreLimit, getDocs } = require('firebase/firestore');
        const db = getFirestoreApp();

        const ridesRef = collection(db, 'rides');
        const q = query(
            ridesRef,
            where('customerId', '==', customerId),
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
                stops: data.stops?.map(s => s.address) || [],
                distance: data.actualDistanceKm || data.distanceKm,
                duration: data.actualDurationMin || data.durationMin,
                fare: data.finalFare || data.estimatedFare,
                paymentMethod: data.paymentMethod,
                driverName: data.driverDetails?.name || 'Driver',
                driverRating: data.driverRating?.stars || null,
                yourRating: data.customerRating?.stars || null
            });
        });

        res.json({ success: true, rides, total: rides.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get active vehicle categories (for UI selection)
 */
exports.getVehicleCategories = async (req, res) => {
    try {
        const vehicleCategoryService = require('../services/vehicleCategoryService');
        const categories = await vehicleCategoryService.getActiveCategories();
        res.json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
