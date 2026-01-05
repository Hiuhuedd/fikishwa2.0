const express = require('express');
const router = express.Router();
const driverAuthController = require('../controllers/driverAuthController');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// Rate Limiter for Send OTP
const otpRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    keyGenerator: (req) => req.body.phone || req.ip,
    handler: (req, res) => res.status(429).json({ success: false, message: "Too many OTP requests. Please try again later." })
});

router.post('/send-otp', otpRateLimiter, driverAuthController.sendOtp);
router.post('/verify-otp', driverAuthController.verifyOtp);
router.post('/update-profile', authMiddleware, driverAuthController.updateProfile);
router.post('/submit-registration', authMiddleware, driverAuthController.submitRegistration);

module.exports = router;
