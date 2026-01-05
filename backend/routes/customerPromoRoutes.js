const express = require('express');
const router = express.Router();
const customerPromoController = require('../controllers/customerPromoController');
const verifyToken = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// All routes require customer authentication
router.use(verifyToken);
router.use(checkRole('customer'));

router.post('/apply', customerPromoController.applyPromo);
router.get('/available', customerPromoController.getAvailablePromos);

module.exports = router;
