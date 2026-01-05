const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
require('dotenv').config();

// Firebase Client Configuration
// This should ideally be populated with your actual Firebase Web Config
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyANZ80V-pMUIHCOsEPZpPfhRNL_p4DNu4k",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "fikishwa-b6d3c.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "fikishwa-b6d3c",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "fikishwa-b6d3c.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "791643747460",
    appId: process.env.FIREBASE_APP_ID || "1:791643747460:web:1060c1830f0c77d87b3ed1",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-YB8HHG1BBL"
};

let app;
let db;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('🔥 Firebase Client App Initialized');
} catch (error) {
    console.error('❌ Failed to initialize Firebase Client App:', error);
}

const getFirestoreApp = () => {
    return db;
};

module.exports = {
    getFirestoreApp
};
