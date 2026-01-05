const promotionService = require('../services/promotionService');
const { getFirestoreApp } = require('../firebase');
const { collection, getDocs, query, where } = require('firebase/firestore');

const db = getFirestoreApp();

/**
 * Apply a promotion to get discount details
 */
exports.applyPromo = async (req, res) => {
    try {
        const { promoCode, fareAmount } = req.body;
        const userId = req.user.uid;

        if (!promoCode) {
            return res.status(400).json({ success: false, message: 'Promo code is required' });
        }

        const result = await promotionService.validatePromotion(promoCode, userId, Number(fareAmount));

        res.json({
            success: true,
            promo: result
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

/**
 * Get available promotions for the user
 * (Currently returns all general active promos)
 */
exports.getAvailablePromos = async (req, res) => {
    try {
        const promosRef = collection(db, 'promotions');
        const q = query(
            promosRef,
            where('active', '==', true),
            where('applicableTo', 'in', ['all', 'first_ride'])
        );

        const snapshot = await getDocs(q);
        const promotions = [];
        const now = new Date();

        snapshot.forEach(doc => {
            const data = doc.data();
            // Basic filtering for expiration
            if (data.validUntil && now > data.validUntil.toDate()) return;
            if (data.validFrom && now < data.validFrom.toDate()) return;
            if (data.maxUses && data.usedCount >= data.maxUses) return;

            promotions.push({
                code: data.code,
                description: `Get ${data.type === 'fixed' ? 'KES ' + data.value : data.value + '%'} off`,
                type: data.type,
                value: data.value,
                validUntil: data.validUntil ? data.validUntil.toDate() : null
            });
        });

        res.json({ success: true, promotions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
