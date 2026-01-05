const { getFirestoreApp } = require('../firebase');
const { collection, getDocs, orderBy, query, limit } = require('firebase/firestore');

const db = getFirestoreApp();

/**
 * Get all customers
 */
exports.getAllCustomers = async (req, res) => {
    try {
        const { limit: limitParam } = req.query;
        const resultLimit = parseInt(limitParam) || 50;

        const customersRef = collection(db, 'customers');
        const q = query(customersRef, orderBy('createdAt', 'desc'), limit(resultLimit));

        const snapshot = await getDocs(q);
        const customers = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            customers.push({
                id: doc.id,
                name: data.name || 'Unknown',
                phone: data.phone,
                email: data.email || null,
                profilePhoto: data.profilePhotoUrl || null,
                createdAt: data.createdAt ? data.createdAt.toDate() : null,
                rideStats: data.rideHistorySummary || { totalRides: 0, totalSpent: 0 }
            });
        });

        res.json({
            success: true,
            count: customers.length,
            customers
        });
    } catch (error) {
        console.error('Get All Customers Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
