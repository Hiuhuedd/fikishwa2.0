const { getFirestoreApp } = require('../firebase');
const { collection, query, where, getDocs, updateDoc, doc } = require('firebase/firestore');
require('dotenv').config();

const db = getFirestoreApp();

async function cleanupRides(driverId) {
    console.log(`🧹 Cleaning up active rides for driver: ${driverId}...`);

    const ridesRef = collection(db, 'rides');
    const statuses = ['accepted', 'arriving', 'arrived', 'in_progress', 'picking_up', 'searching'];

    const q = query(
        ridesRef,
        where('driverId', '==', driverId),
        where('status', 'in', statuses)
    );

    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.size} active rides.`);

    for (const rideDoc of snapshot.docs) {
        console.log(`- Cancelling ride: ${rideDoc.id} (Status: ${rideDoc.data().status})`);
        await updateDoc(doc(db, 'rides', rideDoc.id), {
            status: 'cancelled_cleanup',
            updatedAt: new Date()
        });
    }

    // Also reset busy status in activeDrivers
    const driverActiveRef = doc(db, 'activeDrivers', driverId);
    await updateDoc(driverActiveRef, {
        busy: false
    }).catch(() => console.log('Driver not in activeDrivers collection.'));

    console.log('✅ Cleanup complete.');
}

// Get driverId from args or use a placeholder
const driverId = process.argv[2];
if (!driverId) {
    console.error('Please provide a driverId as an argument.');
    process.exit(1);
}

cleanupRides(driverId).catch(console.error);
