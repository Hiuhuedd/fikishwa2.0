const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

router.post('/mock-ride', testController.triggerMockRide);

module.exports = router;
