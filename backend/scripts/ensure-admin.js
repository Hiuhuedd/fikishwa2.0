const { getFirestoreApp } = require('../firebase');
const { collection, query, where, getDocs, addDoc, Timestamp } = require('firebase/firestore');

async function ensureAdmin() {
    try {
        const db = getFirestoreApp();
        const phone = '+254743466032';
        
        console.log(`Checking if ${phone} is an admin...`);
        const adminsRef = collection(db, 'admins');
        const q = query(adminsRef, where("phone", "==", phone));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log(`Admin not found. Creating admin entry...`);
            await addDoc(collection(db, 'admins'), {
                phone: phone,
                name: 'System Admin',
                role: 'admin',
                createdAt: Timestamp.now()
            });
            console.log('Admin created successfully.');
        } else {
            console.log('Admin already exists.');
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

ensureAdmin();
