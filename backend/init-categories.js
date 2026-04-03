const { getFirestoreApp } = require('./firebase');
const { doc, setDoc, serverTimestamp } = require('firebase/firestore');
require('dotenv').config();

const db = getFirestoreApp();

const categories = [
    {
        categoryId: 'standard',
        name: 'Standard',
        description: 'Everyday affordable rides',
        baseFare: 150,
        perKmRate: 40,
        perMinRate: 5,
        perStopFee: 100,
        minFare: 150,
        maxPassengers: 4,
        iconEmoji: '🚗',
        active: true,
        sortOrder: 1
    },
    {
        categoryId: 'premium',
        name: 'Premium',
        description: 'Luxury comfort and style',
        baseFare: 300,
        perKmRate: 55,
        perMinRate: 8,
        perStopFee: 150,
        minFare: 300,
        maxPassengers: 4,
        iconEmoji: '🚙',
        active: true,
        sortOrder: 2
    },
    {
        categoryId: 'fikaa',
        name: 'Fikaa',
        description: 'Fast and flexible rides',
        baseFare: 100,
        perKmRate: 30,
        perMinRate: 3,
        perStopFee: 50,
        minFare: 100,
        maxPassengers: 1,
        iconEmoji: '🛵',
        active: true,
        sortOrder: 3
    }
];

async function initCategories() {
    console.log('🚀 Initializing vehicle categories...');
    for (const cat of categories) {
        const catRef = doc(db, 'vehicleCategories', cat.categoryId);
        await setDoc(catRef, {
            ...cat,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp()
        }, { merge: true });
        console.log(`✅ Category initialized: ${cat.categoryId}`);
    }
    console.log('✨ All categories initialized successfully!');
}

initCategories().catch(console.error);
