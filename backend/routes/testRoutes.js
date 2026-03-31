const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { getAvailableDrivers } = require('../services/socketService');

router.post('/mock-ride', testController.triggerMockRide);

// Debug endpoint: returns all available drivers currently tracked
router.get('/drivers', (req, res) => {
    const drivers = getAvailableDrivers();
    res.json({ success: true, count: drivers.length, drivers });
});

module.exports = router;
