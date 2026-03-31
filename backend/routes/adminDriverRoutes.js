const express = require('express');
const router = express.Router();
const adminDriverController = require('../controllers/adminDriverController');
const verifyToken = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// All routes require admin authentication
router.use(verifyToken);
router.use(checkRole('admin'));

router.use((req, res, next) => {
    console.log(`👤 Entering Driver Router: ${req.method} ${req.url}`);
    next();
});

// List endpoints
router.get('/pending', adminDriverController.getPendingDrivers);
router.get('/all', adminDriverController.getAllDrivers);
router.get('/:driverId', adminDriverController.getDriverDetails);

// Action endpoints
router.post('/:driverId/approve', adminDriverController.approveDriver);
router.post('/:driverId/reject', adminDriverController.rejectDriver);
router.post('/:driverId/update-category', adminDriverController.updateDriverCategory);
router.post('/:driverId/verify-document', adminDriverController.verifyDocument);

module.exports = router;
