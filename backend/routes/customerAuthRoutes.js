const express = require('express');
const router = express.Router();
const customerAuthController = require('../controllers/customerAuthController');
const rateLimit = require('express-rate-limit');

const authMiddleware = require('../middleware/authMiddleware');

// Rate Limiter for Send OTP
const otpRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 requests per windowMs
    keyGenerator: (req) => req.body.phone || req.ip,
    handler: (req, res) => res.status(429).json({ success: false, message: "Too many OTP requests. Please try again later." })
});

router.post('/send-otp', otpRateLimiter, customerAuthController.sendOtp);
router.post('/verify-otp', customerAuthController.verifyOtp);
router.post('/update-profile', authMiddleware, customerAuthController.updateProfile);

module.exports = router;
