const express = require('express');
const router = express.Router();
const adminPayoutController = require('../controllers/adminPayoutController');
const verifyToken = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// All routes require admin authentication
router.use(verifyToken);
router.use(checkRole('admin'));

router.get('/drivers-owing', adminPayoutController.getDriversOwingCommission);
router.get('/drivers-owed', adminPayoutController.getDriversOwedPayouts);
router.get('/statistics', adminPayoutController.getPayoutStatistics);
router.get('/revenue', adminPayoutController.getRevenueStats);

module.exports = router;
