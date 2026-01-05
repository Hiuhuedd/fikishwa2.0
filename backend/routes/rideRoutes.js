const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const verifyToken = require('../middleware/authMiddleware');

// All ride routes require authentication
router.use(verifyToken);

router.post('/search-location', rideController.searchLocation);
router.post('/estimate', rideController.getEstimate);
router.post('/request', rideController.requestRide);
router.post('/cancel', rideController.cancelRide);
router.post('/rate', rideController.rateDriver);
router.get('/history', rideController.getRideHistory);
router.get('/vehicle-categories', rideController.getVehicleCategories);

module.exports = router;
