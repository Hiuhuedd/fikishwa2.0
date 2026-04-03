const { getFirestoreApp } = require('./firebase');
const { collection, getDocs } = require('firebase/firestore');
require('dotenv').config();

const db = getFirestoreApp();

async function debugFirestore() {
    console.log('\n--- DRIVERS REPOSITORY ---');
    const driversRef = collection(db, 'drivers');
    const driverSnap = await getDocs(driversRef);
    console.log(`Found ${driverSnap.size} drivers in master collection:`);
    driverSnap.forEach(doc => {
        const data = doc.data();
        console.log(`- ID: ${doc.id} | Name: ${data.name || 'N/A'} | Status: ${data.registrationStatus} | Type: ${data.vehicleType || 'standard'}`);
    });

    console.log('\n--- ACTIVE DRIVERS POOL ---');
    const activeRef = collection(db, 'activeDrivers');
    const activeSnap = await getDocs(activeRef);
    console.log(`Found ${activeSnap.size} drivers currently active:`);
    activeSnap.forEach(doc => {
        const data = doc.data();
        console.log(`- ID: ${doc.id} | Online: ${data.online} | Busy: ${data.busy} | Category: ${data.currentCategory} | Geohash: ${data.geohash}`);
    });

    console.log('\n--- PENDING RIDE REQUESTS ---');
    const requestRef = collection(db, 'rideRequests');
    const requestSnap = await getDocs(requestRef);
    console.log(`Found ${requestSnap.size} pending requests:`);
    requestSnap.forEach(doc => {
        const data = doc.data();
        console.log(`- ID: ${doc.id} | Category: ${data.vehicleCategory} | Geohash: ${data.geohash} | Status: ${data.status}`);
    });

    console.log('\n--- VEHICLE CATEGORIES ---');
    const catRef = collection(db, 'vehicleCategories');
    const catSnap = await getDocs(catRef);
    console.log(`Found ${catSnap.size} categories:`);
    catSnap.forEach(doc => {
        const data = doc.data();
        console.log(`- ID: ${doc.id} | Name: ${data.name} | Active: ${data.active} | Order: ${data.sortOrder}`);
    });
}

debugFirestore().catch(console.error);
