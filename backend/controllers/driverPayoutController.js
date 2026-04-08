const { getFirestoreApp } = require('../firebase');
const {
    collection, query, where, getDocs, orderBy, doc,
    runTransaction, serverTimestamp, getDoc, getCountFromServer
} = require('firebase/firestore');
const commissionEnforcement = require('../services/commissionEnforcementService');
const configService = require('../services/configService');

const db = getFirestoreApp();

/**
 * Get detailed daily payout history
 */
exports.getDailyHistory = async (req, res) => {
    try {
        const driverId = req.user.uid;
        console.log(`🔐 [PayoutDebug] Request from UID: ${driverId}`);
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
        console.log(`Querying rides for [${driverId}] from [${startDate.toISOString()}] to [${endDate.toISOString()}]`);

        const q = query(
            ridesRef,
            where('driverId', '==', driverId),
            where('status', '==', 'completed'),
            where('completedAt', '>=', startDate),
            where('completedAt', '<=', endDate),
            orderBy('completedAt', 'desc')
        );

        const snapshot = await getDocs(q);
        console.log('Query successful, found trips:', snapshot.size);
        const trips = [];
        let totalFare = 0;
        let totalCommission = 0;
        let totalDriverShare = 0;

        snapshot.forEach((doc, index) => {
            const data = doc.data();
            if (index === 0) console.log(`🔍 [PayoutDebug] Raw ride data for ${doc.id}:`, JSON.stringify(data, null, 2));
            const fare = data.finalFare || 0;
            const com = data.commission || 0;
            const share = data.driverShare || (fare - com);

            totalFare += fare;
            totalCommission += com;
            totalDriverShare += share;

            trips.push({
                rideId: doc.id,
                time: (data.completedAt && typeof data.completedAt.toDate === 'function')
                    ? data.completedAt.toDate().toLocaleTimeString()
                    : (data.completedAt ? new Date(data.completedAt).toLocaleTimeString() : ''),
                pickup: data.pickup?.address || 'Unknown Pickup',
                dropoff: data.dropoff?.address || 'Unknown Dropoff',
                fare: fare,
                commission: com,
                driverShare: share,
                amount: share, // Alias for frontend
                date: data.completedAt ? (typeof data.completedAt.toDate === 'function' ? data.completedAt.toDate() : new Date(data.completedAt)) : new Date(), // Date object or raw
                paymentMethod: data.paymentMethod // 'cash' or 'mpesa'
            });
        });

        // Get current driver status and owed amounts
        const driverDoc = await getDoc(doc(db, 'drivers', driverId));
        console.log(`📊 [PayoutDebug] Driver document exists: ${driverDoc.exists()}`);
        const driverData = driverDoc.exists() ? driverDoc.data() : {};
        if (driverDoc.exists()) {
            console.log(`📊 [PayoutDebug] Driver Data:`, JSON.stringify(driverData, null, 2));
        }
        // Get all-time trip count via aggregation for accuracy
        const allRidesQuery = query(
            collection(db, 'rides'),
            where('driverId', '==', driverId),
            where('status', '==', 'completed')
        );
        const allRidesSnapshot = await getCountFromServer(allRidesQuery);
        const allTimeTripsCount = allRidesSnapshot.data().count;

        const summary = {
            date: dateQuery,
            driverName: driverData.name || 'Unknown',
            driverEmail: driverData.email || 'N/A',
            todayTrips: trips.length,
            totalTrips: trips.length, // Keep for legacy
            allTimeTrips: allTimeTripsCount || driverData.totalRides || 0,
            totalFare,
            totalCommission,
            todayDriverShare: totalDriverShare,
            totalDriverShare: totalDriverShare, // Keep for legacy (today's share)
            totalEarnings: driverData.totalEarnings || 0, // This is now ALL-TIME balance
            currentOwedCommission: driverData.owedCommission || 0,
            pendingPayout: driverData.pendingPayout || 0,
            payoutPreference: driverData.payoutPreference || 'direct-to-driver'
        };

        // Payment instructions if owing commission
        let paymentInstructions = null;
        if (summary.currentOwedCommission > 0) {
            const config = await configService.getConfig();
            const paybill = config.paybillNumber || "4005473";
            const maxOwed = config.maxOwedCommission || 400;
            const isBlocked = summary.currentOwedCommission >= maxOwed;

            summary.maxOwedCommission = maxOwed;
            summary.isBlocked = isBlocked;

            paymentInstructions = {
                paybill: paybill,
                accountNumber: driverData.phone || 'N/A',
                amount: summary.currentOwedCommission,
                instructions: "Lipa na M-Pesa -> Paybill -> Enter Business No. -> Enter Account No. (Phone) -> Enter Amount -> Enter Pin"
            };
        }

        res.json({
            success: true,
            summary,
            trips,
            paymentInstructions
        });

    } catch (error) {
        console.error('--- Get Daily History Error Deep Dive ---');
        console.error('Message:', error.message);
        console.error('Code:', error.code);
        if (error.customData) console.error('Custom Data:', error.customData);
        if (error.details) console.error('Details:', error.details);
        console.error('Stack:', error.stack);
        console.error('-----------------------------------------');
        res.status(500).json({ success: false, error: error.message });
    }
};


