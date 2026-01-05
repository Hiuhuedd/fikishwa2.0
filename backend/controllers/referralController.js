const promotionService = require('../services/promotionService');
const { getFirestoreApp } = require('../firebase');
const { doc, getDoc, updateDoc } = require('firebase/firestore');

const db = getFirestoreApp();

/**
 * Get my referral code and stats
 */
exports.getMyReferralCode = async (req, res) => {
    try {
        const userId = req.user.uid;
        const userRole = req.user.role === 'driver' ? 'drivers' : 'customers';
        const userRef = doc(db, userRole, userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const data = userDoc.data();
        let code = data.referralCode;

        // Lazy generation if not exists
        if (!code) {
            code = await promotionService.generateReferralCode(data.phone);
            await updateDoc(userRef, { referralCode: code });
        }

        // Calculate stats (simplified)
        // Ideally we query the 'referrals' collection for exact count
        const earnedBonuses = data.earnedBonuses || [];
        const referralBonuses = earnedBonuses.filter(b => b.type === 'referral');
        const totalReferred = referralBonuses.length; // Approximation or separate query needed for exact count
        const totalEarned = referralBonuses.reduce((sum, b) => sum + (b.value || 0), 0);

        res.json({
            success: true,
            referralCode: code,
            totalReferred,
            earnedFromReferrals: totalEarned
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Redeem a referral code (Post-signup)
 */
exports.redeemReferral = async (req, res) => {
    try {
        const { referralCode } = req.body;
        const userId = req.user.uid;
        const userPhone = req.user.phone;

        if (!referralCode) {
            return res.status(400).json({ success: false, message: 'Referral code is required' });
        }

        const result = await promotionService.processReferral(referralCode, userId, userPhone);

        res.json({
            success: true,
            message: 'Referral code redeemed successfully',
            bonus: result.bonusAmount
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

/**
 * Get my earned bonuses
 */
exports.getMyBonuses = async (req, res) => {
    try {
        const userId = req.user.uid;
        const userRole = req.user.role === 'driver' ? 'drivers' : 'customers';
        const userRef = doc(db, userRole, userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const bonuses = (userDoc.data().earnedBonuses || []).filter(b => !b.used);

        res.json({
            success: true,
            bonuses
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
