const { getFirestoreApp } = require('../firebase');
const {
    collection, query, where, getDocs, orderBy, limit
} = require('firebase/firestore');

const db = getFirestoreApp();

/**
 * Get drivers who owe commission
 */
exports.getDriversOwingCommission = async (req, res) => {
    try {
        const driversRef = collection(db, 'drivers');
        const q = query(
            driversRef,
            where('owedCommission', '>', 0),
            orderBy('owedCommission', 'desc'),
            limit(100)
        );

        const snapshot = await getDocs(q);
        const drivers = [];
        let totalOwed = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            totalOwed += (data.owedCommission || 0);
            drivers.push({
                driverId: doc.id,
                name: data.name || 'Unknown',
                phone: data.phone,
                owedCommission: data.owedCommission || 0,
                lastTripAt: data.lastTripAt ? data.lastTripAt.toDate() : null
            });
        });

        res.json({
            success: true,
            count: drivers.length,
            totalOwed,
            drivers
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get drivers who are owed payouts
 */
exports.getDriversOwedPayouts = async (req, res) => {
    try {
        const driversRef = collection(db, 'drivers');
        const q = query(
            driversRef,
            where('pendingPayout', '>', 0),
            orderBy('pendingPayout', 'desc'),
            limit(100)
        );

        const snapshot = await getDocs(q);
        const drivers = [];
        let totalPending = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            totalPending += (data.pendingPayout || 0);
            drivers.push({
                driverId: doc.id,
                name: data.name || 'Unknown',
                phone: data.phone,
                pendingPayout: data.pendingPayout || 0,
                payoutPreference: data.payoutPreference || 'standard'
            });
        });

        res.json({
            success: true,
            count: drivers.length,
            totalPending,
            drivers
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get general payout statistics
 */
exports.getPayoutStatistics = async (req, res) => {
    try {
        const driversRef = collection(db, 'drivers');
        // Simple aggregate queries
        const owingQ = query(driversRef, where('owedCommission', '>', 0));
        const owedQ = query(driversRef, where('pendingPayout', '>', 0));

        const [owingSnap, owedSnap] = await Promise.all([
            getDocs(owingQ),
            getDocs(owedQ)
        ]);

        let totalOwedCommission = 0;
        let totalPendingPayouts = 0;

        owingSnap.forEach(d => totalOwedCommission += (d.data().owedCommission || 0));
        owedSnap.forEach(d => totalPendingPayouts += (d.data().pendingPayout || 0));

        res.json({
            success: true,
            stats: {
                totalOwedCommission,
                totalPendingPayouts,
                driversOwingCount: owingSnap.size,
                driversOwedCount: owedSnap.size
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get revenue stats (placeholder or basic impl)
 */
exports.getRevenueStats = async (req, res) => {
    try {
        // Placeholder for revenue charts
        // In a real implementation this would aggregate from a 'transactions' or 'revenue_daily' collection
        res.json({
            success: true,
            revenue: {
                daily: [],
                weekly: [],
                monthly: []
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
