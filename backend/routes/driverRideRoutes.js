const express = require('express');
const router = express.Router();
const driverRideController = require('../controllers/driverRideController');
const verifyToken = require('../middleware/authMiddleware');

// All driver ride routes require authentication
router.use(verifyToken);

router.post('/status/online', driverRideController.goOnline);
router.post('/status/offline', driverRideController.goOffline);
router.post('/accept', driverRideController.acceptRide);
router.post('/start', driverRideController.startRide);
router.post('/complete', driverRideController.completeRide);
router.post('/rate-customer', driverRideController.rateCustomer);
router.get('/recent', driverRideController.getRecentRides);
router.get('/available-categories', driverRideController.getAvailableCategories);

module.exports = router;
