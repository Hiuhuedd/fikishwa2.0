const { getFirestoreApp } = require('../firebase');
const {
    collection,
    addDoc,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    setDoc,
    Timestamp,
    query,
    where,
    getDocs,
    increment
} = require('firebase/firestore');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const smsService = require('./smsService');

class CustomerAuthService {
    constructor() {
        this.db = getFirestoreApp();
        this.jwtSecret = process.env.JWT_SECRET || 'fallback_secret_change_me';
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '30d';
    }

    async sendOtp(phone, ipAddress) {
        const normalizedPhone = smsService.normalizePhone(phone);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
        const expiresAt = Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000));

        const docRef = await addDoc(collection(this.db, 'otpSessions'), {
            phone: normalizedPhone,
            hashedOtp: hashedOtp,
            attempts: 0,
            expiresAt: expiresAt,
            createdAt: Timestamp.now(),
            ip: ipAddress || 'unknown'
        });

        const sessionId = docRef.id;
        const message = `Your Fikishwa verification code is ${otp}. Valid for 5 minutes. Do not share.`;

        await smsService.sendSMS(normalizedPhone, message, "system", "auth_otp");

        return sessionId;
    }

    async verifyOtp(sessionId, otp) {
        const sessionRef = doc(this.db, 'otpSessions', sessionId);
        const sessionDoc = await getDoc(sessionRef);

        if (!sessionDoc.exists()) {
            throw new Error('INVALID_SESSION');
        }

        const sessionData = sessionDoc.data();
        const now = Timestamp.now();

        if (sessionData.expiresAt.toMillis() < now.toMillis()) {
            throw new Error('SESSION_EXPIRED');
        }

        if (sessionData.attempts >= 3) {
            throw new Error('MAX_ATTEMPTS_EXCEEDED');
        }

        const submittedHash = crypto.createHash('sha256').update(otp).digest('hex');
        if (submittedHash !== sessionData.hashedOtp) {
            await updateDoc(sessionRef, { attempts: increment(1) });
            throw new Error('INVALID_OTP');
        }

        // OTP Valid
        await deleteDoc(sessionRef);

        const phone = sessionData.phone;

        // Check if customer exists in Firestore
        const customersRef = collection(this.db, 'customers');
        const q = query(customersRef, where("phone", "==", phone));
        const querySnapshot = await getDocs(q);

        let uid;
        let isNewUser = false;
        let customerDocRef;

        if (!querySnapshot.empty) {
            // Customer exists
            const userDoc = querySnapshot.docs[0];
            uid = userDoc.id;
            customerDocRef = doc(this.db, 'customers', uid);

            // Update last login
            await updateDoc(customerDocRef, { lastLoginAt: Timestamp.now() });
        } else {
            // New Customer
            isNewUser = true;
            uid = crypto.randomUUID();
            customerDocRef = doc(this.db, 'customers', uid);

            // Initialize with default values
            await setDoc(customerDocRef, {
                uid: uid,
                phone: phone,
                name: '',
                profilePhotoUrl: '',
                emergencyContact: '',
                createdAt: Timestamp.now(),
                lastLoginAt: Timestamp.now(),
                rideHistorySummary: { totalRides: 0, totalSpent: 0 }
            });
        }

        // Fetch final profile
        const finalDoc = await getDoc(customerDocRef);
        const userProfile = finalDoc.data();

        // Generate standard JWT instead of Firebase Custom Token
        const token = jwt.sign(
            { uid: uid, phone: phone, role: 'customer' },
            this.jwtSecret,
            { expiresIn: this.jwtExpiresIn }
        );

        return {
            token, // Renamed from customToken to token
            userProfile,
            isNewUser
        };
    }

    async updateProfile(uid, profileData) {
        const customerDocRef = doc(this.db, 'customers', uid);
        const docSnap = await getDoc(customerDocRef);

        if (!docSnap.exists()) {
            throw new Error('USER_NOT_FOUND');
        }

        const updatePayload = {};
        if (profileData.name) updatePayload.name = profileData.name;
        if (profileData.profilePhotoUrl) updatePayload.profilePhotoUrl = profileData.profilePhotoUrl;
        if (profileData.emergencyContact) updatePayload.emergencyContact = profileData.emergencyContact;

        if (Object.keys(updatePayload).length > 0) {
            await updateDoc(customerDocRef, updatePayload);
        }

        const updatedDoc = await getDoc(customerDocRef);
        return updatedDoc.data();
    }
}

module.exports = new CustomerAuthService();
