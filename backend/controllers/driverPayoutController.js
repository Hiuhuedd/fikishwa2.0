const { getFirestoreApp } = require('../firebase');
const {
    collection, query, where, getDocs, orderBy, doc,
    runTransaction, serverTimestamp, getDoc
} = require('firebase/firestore');
const commissionEnforcement = require('../services/commissionEnforcementService');

const db = getFirestoreApp();

/**
 * Get detailed daily payout history
 */
exports.getDailyHistory = async (req, res) => {
    try {
        const driverId = req.user.uid;
        // Default to today using simple string format YYYY-MM-DD
        // In a real app, handle timezone carefully. Here we assume query param is passed or defaults to server day.
        const dateQuery = req.query.date || new Date().toISOString().split('T')[0];

        // Create range for the selected day
        const startDate = new Date(dateQuery);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateQuery);
        endDate.setHours(23, 59, 59, 999);

        // Fetch completed rides for this driver in range
        const ridesRef = collection(db, 'rides');
        const q = query(
            ridesRef,
            where('driverId', '==', driverId),
            where('status', '==', 'completed'),
            where('completedAt', '>=', startDate),
            where('completedAt', '<=', endDate),
            orderBy('completedAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const trips = [];
        let totalFare = 0;
        let totalCommission = 0;
        let totalDriverShare = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            const fare = data.finalFare || 0;
            const com = data.commission || 0;
            const share = data.driverShare || (fare - com);

            totalFare += fare;
            totalCommission += com;
            totalDriverShare += share;

            trips.push({
                rideId: doc.id,
                time: data.completedAt ? data.completedAt.toDate().toLocaleTimeString() : '',
                pickup: data.pickup.address,
                dropoff: data.dropoff.address,
                fare: fare,
                commission: com,
                driverShare: share,
                paymentMethod: data.paymentMethod // 'cash' or 'mpesa'
            });
        });

        // Get current driver status and owed amounts
        const driverDoc = await getDoc(doc(db, 'drivers', driverId));
        const driverData = driverDoc.exists() ? driverDoc.data() : {};

        const summary = {
            date: dateQuery,
            totalTrips: trips.length,
            totalFare,
            totalCommission,
            totalDriverShare,
            currentOwedCommission: driverData.owedCommission || 0,
            pendingPayout: driverData.pendingPayout || 0,
            payoutPreference: driverData.payoutPreference || 'direct-to-driver'
        };

        // Payment instructions if owing commission
        let paymentInstructions = null;
        if (summary.currentOwedCommission > 0) {
            paymentInstructions = {
                paybill: "FIKISHWA_PAYBILL", // In real config
                accountNumber: driverData.phone,
                amount: summary.currentOwedCommission,
                instructions: "Go to M-Pesa > Paybill > Enter Paybill No > Account No > Amount"
            };
        }

        res.json({
            success: true,
            summary,
            trips,
            paymentInstructions
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


