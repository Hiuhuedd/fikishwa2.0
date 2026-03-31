const express = require('express');
const router = express.Router();
const driverRideController = require('../controllers/driverRideController');
const verifyToken = require('../middleware/authMiddleware');

// All driver ride routes require authentication
console.log('🏁 [LOAD] driverRideRoutes.js initialized');
router.use((req, res, next) => {
    console.log(`🚕 [ROUTER] driverRideRoutes hit: ${req.method} ${req.url}`);
    next();
});
router.use(verifyToken);

router.post('/status/online', driverRideController.goOnline);
router.post('/status/offline', driverRideController.goOffline);
router.post('/status/update', driverRideController.updateStatus);
router.post('/accept', driverRideController.acceptRide);
router.post('/start', driverRideController.startRide);
router.post('/complete', driverRideController.completeRide);
router.post('/confirm-payment', driverRideController.confirmPayment);
router.post('/rate-customer', driverRideController.rateCustomer);
router.get('/recent', driverRideController.getRecentRides);
router.get('/history', driverRideController.getRideHistory);
router.get('/active', driverRideController.getActiveRide);
router.post('/cancel', driverRideController.cancelRide);
router.get('/available-categories', driverRideController.getAvailableCategories);

module.exports = router;
