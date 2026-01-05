const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// Strict Rate Limiter for Admin OTP
const adminOtpRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Only 3 attempts per hour for admins
    keyGenerator: (req) => req.body.phone || req.ip,
    handler: (req, res) => res.status(429).json({ success: false, message: "Too many admin login attempts. Please try again later." })
});

router.post('/send-otp', adminOtpRateLimiter, adminAuthController.sendOtp);
router.post('/verify-otp', adminAuthController.verifyOtp);

// Driver Management (Admin Only)
router.post('/verify-driver', authMiddleware, checkRole('admin'), adminAuthController.verifyDriver);
router.post('/toggle-driver-status', authMiddleware, checkRole('admin'), adminAuthController.toggleDriverStatus);

module.exports = router;
