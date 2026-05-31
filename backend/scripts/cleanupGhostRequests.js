const { getFirestoreApp } = require('../firebase');
const { collection, getDocs, doc, getDoc, deleteDoc } = require('firebase/firestore');

const db = getFirestoreApp();

async function cleanup() {
    console.log('Starting cleanup of ghost ride requests...');
    const reqsRef = collection(db, 'rideRequests');
    const snapshot = await getDocs(reqsRef);
    let deletedCount = 0;

    for (const requestDoc of snapshot.docs) {
        const rideId = requestDoc.id;
        const rideRef = doc(db, 'rides', rideId);
        const rideSnap = await getDoc(rideRef);

        if (!rideSnap.exists()) {
            console.log(`Ride ${rideId} not found in rides collection. Deleting ghost request.`);
            await deleteDoc(requestDoc.ref);
            deletedCount++;
        } else {
            const rideData = rideSnap.data();
            if (rideData.status !== 'searching' && rideData.status !== 'pending') {
                console.log(`Ride ${rideId} is no longer pending (status: ${rideData.status}). Deleting ghost request.`);
                await deleteDoc(requestDoc.ref);
                deletedCount++;
            }
        }
    }
    console.log(`Cleanup complete. Deleted ${deletedCount} ghost requests.`);
    process.exit(0);
}

cleanup().catch(console.error);
