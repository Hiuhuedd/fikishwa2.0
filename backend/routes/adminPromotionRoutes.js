const express = require('express');
const router = express.Router();
const adminPromotionController = require('../controllers/adminPromotionController');
const verifyToken = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// All routes require admin authentication
router.use(verifyToken);
router.use(checkRole('admin'));

router.post('/create', adminPromotionController.createPromotion);
router.get('/all', adminPromotionController.getAllPromotions);
router.delete('/:code', adminPromotionController.deletePromotion);

module.exports = router;
