const adminAuthService = require('../services/adminAuthService');
const adminActionsService = require('../services/adminActionsService');

const sendOtp = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        const sessionId = await adminAuthService.sendOtp(phone, req.ip);

        res.status(200).json({
            success: true,
            message: 'Admin OTP sent successfully',
            data: {
                sessionId
            }
        });
    } catch (error) {
        console.error('Admin Send OTP Error:', error);

        if (error.message === 'NOT_AUTHORIZED_ADMIN') {
            return res.status(403).json({ success: false, message: 'Access Denied: This phone number is not authorized as an admin.' });
        }

        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { sessionId, otp } = req.body;

        if (!sessionId || !otp) {
            return res.status(400).json({ success: false, message: 'Session ID and OTP are required' });
        }

        const result = await adminAuthService.verifyOtp(sessionId, otp);

        res.status(200).json({
            success: true,
            message: 'Admin authentication successful',
            data: result
        });
    } catch (error) {
        console.error('Admin Verify OTP Error:', error);

        if (error.message === 'NOT_AUTHORIZED_ADMIN') {
            return res.status(403).json({ success: false, message: 'Access Denied: Not an authorized admin.' });
        }

        if (error.message === 'INVALID_SESSION' || error.message === 'SESSION_EXPIRED' || error.message === 'INVALID_OTP' || error.message === 'MAX_ATTEMPTS_EXCEEDED') {
            return res.status(401).json({ success: false, message: error.message });
        }

        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Handle Driver Verification
 */
const verifyDriver = async (req, res) => {
    try {
        const { uid, status, reason } = req.body;

        if (!uid || !status) {
            return res.status(400).json({ success: false, message: 'UID and status are required' });
        }

        const result = await adminActionsService.verifyDriver(uid, status, reason);

        res.status(200).json({
            success: true,
            message: `Driver registration ${status} successfully`,
            data: result
        });

    } catch (error) {
        console.error('Admin Verify Driver Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Handle Driving Enabling/Disabling
 */
const toggleDriverStatus = async (req, res) => {
    try {
        const { uid, isEnabled } = req.body;

        if (!uid || isEnabled === undefined) {
            return res.status(400).json({ success: false, message: 'UID and isEnabled status are required' });
        }

        const result = await adminActionsService.toggleDriverStatus(uid, isEnabled);

        res.status(200).json({
            success: true,
            message: `Driver ${isEnabled ? 'enabled' : 'disabled'} successfully`,
            data: result
        });

    } catch (error) {
        console.error('Admin Toggle Driver Status Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    sendOtp,
    verifyOtp,
    verifyDriver,
    toggleDriverStatus
};
