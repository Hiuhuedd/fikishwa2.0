const promotionService = require('../services/promotionService');
const { getFirestoreApp } = require('../firebase');
const { collection, getDocs, query, orderBy, deleteDoc, doc } = require('firebase/firestore');

const db = getFirestoreApp();

exports.createPromotion = async (req, res) => {
    try {
        const promo = await promotionService.createPromotion(req.body);
        res.json({ success: true, message: 'Promotion created successfully', promo });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getAllPromotions = async (req, res) => {
    try {
        const promosRef = collection(db, 'promotions');
        const q = query(promosRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        const promotions = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            promotions.push({
                ...data,
                validFrom: data.validFrom ? data.validFrom.toDate() : null,
                validUntil: data.validUntil ? data.validUntil.toDate() : null
            });
        });

        res.json({ success: true, promotions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deletePromotion = async (req, res) => {
    try {
        const { code } = req.params;
        await deleteDoc(doc(db, 'promotions', code.toUpperCase()));
        res.json({ success: true, message: 'Promotion deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
