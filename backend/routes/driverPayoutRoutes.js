const express = require('express');
const router = express.Router();
const driverPayoutController = require('../controllers/driverPayoutController');
const verifyToken = require('../middleware/authMiddleware');

// All routes require authentication
router.use(verifyToken);

router.get('/daily-history', driverPayoutController.getDailyHistory);


module.exports = router;
