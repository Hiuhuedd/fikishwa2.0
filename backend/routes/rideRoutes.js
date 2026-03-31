const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const verifyToken = require('../middleware/authMiddleware');
const { getAvailableDrivers } = require('../services/socketService');

// All ride routes require authentication
router.use(verifyToken);

router.post('/search-location', rideController.searchLocation);
router.post('/estimate', rideController.getEstimate);
router.post('/request', rideController.requestRide);
router.post('/cancel', rideController.cancelRide);
router.post('/rate-driver', rideController.rateDriver);
router.get('/history', rideController.getRideHistory);
router.get('/active', rideController.getActiveRide);
router.get('/vehicle-categories', rideController.getVehicleCategories);

// Returns currently available drivers from in-memory socket map
router.get('/available-drivers', (req, res) => {
    const drivers = getAvailableDrivers();
    res.json({ success: true, count: drivers.length, drivers });
});

module.exports = router;
