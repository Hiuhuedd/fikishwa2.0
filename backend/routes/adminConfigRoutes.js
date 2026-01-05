const express = require('express');
const router = express.Router();
const adminConfigController = require('../controllers/adminConfigController');

const verifyToken = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// All routes require admin authentication
router.use(verifyToken);
router.use(checkRole('admin'));

router.get('/', adminConfigController.getConfig);
router.post('/update', adminConfigController.updateConfig);

module.exports = router;
