const express = require('express');
const router = express.Router();
const adminRideController = require('../controllers/adminRideController');
const verifyToken = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// All routes require admin authentication
router.use(verifyToken);
router.use(checkRole('admin'));

router.get('/stats', adminRideController.getRideStats);
router.get('/', adminRideController.getAllRides); // GET /api/admin/rides?limit=20&lastDocId=...

module.exports = router;
