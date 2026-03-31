const { getFirestoreApp } = require('./firebase');
const { collection, getDocs } = require('firebase/firestore');
require('dotenv').config();

const db = getFirestoreApp();

async function debugDrivers() {
    console.log('🔍 Listing all drivers in Firestore...');
    const driversRef = collection(db, 'drivers');
    const snapshot = await getDocs(driversRef);

    console.log(`Found ${snapshot.size} drivers:`);
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`- ID: ${doc.id} | uid field: ${data.uid} | Name: ${data.name}`);
    });
}

debugDrivers().catch(console.error);
