const driverAuthService = require('../services/driverAuthService');

const sendOtp = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        const sessionId = await driverAuthService.sendOtp(phone, req.ip);

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            data: {
                sessionId
            }
        });
    } catch (error) {
        console.error('Driver Send OTP Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { sessionId, otp } = req.body;

        if (!sessionId || !otp) {
            return res.status(400).json({ success: false, message: 'Session ID and OTP are required' });
        }

        const result = await driverAuthService.verifyOtp(sessionId, otp);

        res.status(200).json({
            success: true,
            message: 'Authentication successful',
            data: result
        });
    } catch (error) {
        console.error('Driver Verify OTP Error:', error);

        if (error.message === 'INVALID_SESSION' || error.message === 'SESSION_EXPIRED' || error.message === 'INVALID_OTP' || error.message === 'MAX_ATTEMPTS_EXCEEDED') {
            return res.status(401).json({ success: false, message: error.message });
        }

        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const profileData = req.body;
        const uid = req.user.uid;

        const updatedProfile = await driverAuthService.updateProfile(uid, profileData);

        res.status(200).json({
            success: true,
            message: 'Driver profile updated successfully',
            data: updatedProfile
        });

    } catch (error) {
        console.error('Driver Update Profile Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const submitRegistration = async (req, res) => {
    try {
        const uid = req.user.uid;
        const profileData = req.body;

        const updatedDriver = await driverAuthService.submitRegistration(uid, profileData);

        res.status(200).json({
            success: true,
            message: 'Registration submitted successfully. Pending approval.',
            data: updatedDriver
        });

    } catch (error) {
        console.error('Driver Submit Registration Error:', error);

        if (error.message.startsWith('MISSING_DOCUMENTS')) {
            return res.status(400).json({ success: false, message: error.message });
        }

        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }

        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    sendOtp,
    verifyOtp,
    updateProfile,
    submitRegistration
};
