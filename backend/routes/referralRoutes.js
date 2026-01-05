const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const verifyToken = require('../middleware/authMiddleware');

// Authenticated routes (Customer OR Driver)
router.use(verifyToken);

router.get('/referral-code', referralController.getMyReferralCode);
router.post('/redeem', referralController.redeemReferral);
router.get('/bonuses', referralController.getMyBonuses);

module.exports = router;
