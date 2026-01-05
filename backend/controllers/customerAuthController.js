const customerAuthService = require('../services/customerAuthService');

const sendOtp = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        const sessionId = await customerAuthService.sendOtp(phone, req.ip);

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            data: {
                sessionId
            }
        });
    } catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { sessionId, otp } = req.body;

        if (!sessionId || !otp) {
            return res.status(400).json({ success: false, message: 'Session ID and OTP are required' });
        }

        const result = await customerAuthService.verifyOtp(sessionId, otp);

        res.status(200).json({
            success: true,
            message: 'Authentication successful',
            data: result
        });
    } catch (error) {
        console.error('Verify OTP Error:', error);

        if (error.message === 'INVALID_SESSION' || error.message === 'SESSION_EXPIRED' || error.message === 'INVALID_OTP' || error.message === 'MAX_ATTEMPTS_EXCEEDED') {
            return res.status(401).json({ success: false, message: error.message });
        }

        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, profilePhotoUrl, emergencyContact } = req.body;
        const uid = req.user.uid; // From authMiddleware

        const updatedProfile = await customerAuthService.updateProfile(uid, {
            name,
            profilePhotoUrl,
            emergencyContact
        });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedProfile
        });

    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    sendOtp,
    verifyOtp,
    updateProfile
};
