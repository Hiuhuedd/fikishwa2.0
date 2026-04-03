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
    const { pickup, stops, dropoff, rideType, promoCode } = req.body;
    const userId = req.user.uid;

    if (!pickup || !dropoff) {
        return res.status(400).json({ error: 'Pickup and dropoff are required' });
    }

    try {
        const geoService = require('../services/geoService');
        const fareService = require('../services/fareService');
        const vehicleCategoryService = require('../services/vehicleCategoryService');

        const routeData = await geoService.getRoute(pickup, stops || [], dropoff);
        const categories = await vehicleCategoryService.getActiveCategories();

        const estimates = await Promise.all(categories.map(async (cat) => {
            const est = await fareService.calculateEstimate(
                routeData.distance,
                routeData.duration,
                (stops || []).length,
                rideType || 'inperson',
                promoCode,
                userId,
                cat.categoryId,
                null, // parcelDetails
                null, // cachedConfig
                cat   // cachedCategory (bypasses DB lookup)
            );
            return {
                categoryId: cat.categoryId,
                name: cat.name,
                estimatedFare: est.estimatedFare,
                originalFare: est.originalFare,
                discountAmount: est.discountAmount,
                breakdown: est.breakdown,
                eta: cat.estimatedEta || 5,
                iconEmoji: cat.iconEmoji || '🚗',
                imageUrl: cat.image || cat.imageUrl || null,
                capacity: cat.maxPassengers || 4
            };
        }));

        console.log(`[RideController] Calculated ${estimates.length} estimates for route`);

        res.json({
            success: true,
            version: '2026-03-27-v3', // Incremented to verify server restart
            estimates: estimates || [],
            distanceKm: (routeData.distance / 1000).toFixed(2),
            durationMin: Math.ceil(routeData.duration / 60),
            routePolyline: routeData.geometry
        });
    } catch (error) {
        console.error('Get Multi-Estimate Error:', error);
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

    // Log incoming request data for debugging
    console.log(`📋 API Route Hit: POST /api/customer/ride/request`);
    console.log(`[RideController] Request data - customerId: ${customerId}, rideType: ${rideType || 'undefined'}, vehicleCategory: ${vehicleCategory || 'undefined'}`);

    if (!pickup || !dropoff) {
        return res.status(400).json({ error: 'Pickup and dropoff are required' });
    }

    try {
        const sanitizedRideType = (rideType || 'fikaa').toString().trim();
        const sanitizedCategory = (vehicleCategory || sanitizedRideType).toString().trim();

        const ride = await rideService.requestRide({
            customerId,
            customerName,
            pickup,
            stops: stops || [],
            dropoff,
            rideType: sanitizedRideType,
            paymentMethod,
            promoCode,        // Pass promo code
            vehicleCategory: sanitizedCategory   // Pass vehicle category
        });

        res.json({ success: true, ride });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get active ride for customer
 */
exports.getActiveRide = async (req, res) => {
    const customerId = req.user.uid;

    try {
        const { collection, query, where, getDocs, limit: firestoreLimit } = require('firebase/firestore');
        const { getFirestoreApp } = require('../firebase');
        const db = getFirestoreApp();
        const ridesRef = collection(db, 'rides');

        // Find latest ride that isn't completed or cancelled
        const q = query(
            ridesRef,
            where('customerId', '==', customerId),
            where('status', 'in', ['searching', 'accepted', 'arriving', 'arrived', 'in_progress']),
            firestoreLimit(1)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return res.json({ success: true, ride: null });
        }

        const doc = snapshot.docs[0];
        res.json({
            success: true,
            ride: {
                rideId: doc.id,
                ...doc.data()
            }
        });
    } catch (error) {
        console.error('[RideController] getActiveRide error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Cancel a ride
 */
exports.cancelRide = async (req, res) => {
    const { rideId, reason } = req.body;
    const customerId = req.user.uid;

    if (!rideId) {
        return res.status(400).json({ error: 'Ride ID is required' });
    }

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
