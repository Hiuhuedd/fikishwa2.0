const { getFirestoreApp } = require('../firebase');
const { doc, setDoc, Timestamp } = require('firebase/firestore');
const smsService = require('../services/smsService');
require('dotenv').config();

/**
 * Run this script to create an initial admin user.
 * Usage: node scripts/createAdmin.js <phone_number> <name>
 * Example: node scripts/createAdmin.js +254700000001 "System Admin"
 */

const createAdmin = async () => {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log('Usage: node scripts/createAdmin.js <phone_number> <name>');
        process.exit(1);
    }

    const phone = smsService.normalizePhone(args[0]);
    const name = args[1];
    const db = getFirestoreApp();

    try {
        const uid = 'admin_' + Date.now();
        await setDoc(doc(db, 'admins', uid), {
            uid,
            phone,
            name,
            role: 'admin',
            createdAt: Timestamp.now(),
            lastLoginAt: Timestamp.now()
        });
        console.log(`✅ Admin user created successfully!`);
        console.log(`Phone: ${phone}`);
        console.log(`Name: ${name}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to create admin:', error.message);
        process.exit(1);
    }
};

createAdmin();
