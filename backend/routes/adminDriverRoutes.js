const express = require('express');
const router = express.Router();
const adminDriverController = require('../controllers/adminDriverController');
const verifyToken = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// All routes require admin authentication
router.use(verifyToken);
router.use(checkRole('admin'));

// List endpoints
router.get('/pending', adminDriverController.getPendingDrivers);
router.get('/all', adminDriverController.getAllDrivers);
router.get('/:driverId', adminDriverController.getDriverDetails);

// Action endpoints
router.post('/:driverId/approve', adminDriverController.approveDriver);
router.post('/:driverId/reject', adminDriverController.rejectDriver);
router.post('/:driverId/update-category', adminDriverController.updateDriverCategory);

module.exports = router;
