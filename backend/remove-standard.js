const { getFirestoreApp } = require('./firebase');
const { doc, deleteDoc, collection, getDocs, updateDoc } = require('firebase/firestore');
require('dotenv').config();

const db = getFirestoreApp();

async function removeStandard() {
    console.log('🗑️ Removing standard category...');

    // 1. Delete from vehicleCategories
    await deleteDoc(doc(db, 'vehicleCategories', 'standard'));
    console.log('✅ Deleted "standard" from vehicleCategories');

    // 2. Update drivers who have 'standard' as their vehicleType
    const driversRef = collection(db, 'drivers');
    const driverSnap = await getDocs(driversRef);
    for (const d of driverSnap.docs) {
        if (d.data().vehicleType === 'standard') {
            await updateDoc(doc(db, 'drivers', d.id), {
                vehicleType: 'fikaa'
            });
            console.log(`✅ Updated driver ${d.id} vehicleType to "fikaa"`);
        }
    }

    // 3. Update activeDrivers to clear busy status and set category to fikaa
    const activeRef = collection(db, 'activeDrivers');
    const activeSnap = await getDocs(activeRef);
    for (const d of activeSnap.docs) {
        await updateDoc(doc(db, 'activeDrivers', d.id), {
            busy: false,
            currentCategory: 'fikaa'
        });
        console.log(`✅ Reset activeDriver ${d.id} to fikaa and not busy`);
    }

    console.log('✨ Cleanup complete!');
}

removeStandard().catch(console.error);
