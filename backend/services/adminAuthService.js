const { getFirestoreApp } = require('../firebase');
const {
    collection,
    addDoc,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    Timestamp,
    query,
    where,
    getDocs,
    increment
} = require('firebase/firestore');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const smsService = require('./smsService');

class AdminAuthService {
    constructor() {
        this.db = getFirestoreApp();
        this.jwtSecret = process.env.JWT_SECRET || 'fallback_secret_change_me';
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '30d';
    }

    async sendOtp(phone, ipAddress) {
        const normalizedPhone = smsService.normalizePhone(phone);

        // Security check: Only send OTP if phone exists in 'admins' collection
        const adminsRef = collection(this.db, 'admins');
        const q = query(adminsRef, where("phone", "==", normalizedPhone));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error('NOT_AUTHORIZED_ADMIN');
        }

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
        const message = `Your Fikishwa Admin access code is ${otp}. Valid for 5 minutes.`;

        await smsService.sendSMS(normalizedPhone, message, "system", "auth_otp_admin");

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

        // Final check for admin profile
        const adminsRef = collection(this.db, 'admins');
        const q = query(adminsRef, where("phone", "==", phone));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error('NOT_AUTHORIZED_ADMIN');
        }

        const adminDoc = querySnapshot.docs[0];
        const uid = adminDoc.id;
        const adminData = adminDoc.data();

        // Update last login
        await updateDoc(doc(this.db, 'admins', uid), { lastLoginAt: Timestamp.now() });

        // Generate JWT with role: 'admin'
        const token = jwt.sign(
            { uid: uid, phone: phone, role: 'admin' },
            this.jwtSecret,
            { expiresIn: this.jwtExpiresIn }
        );

        return {
            token,
            profile: adminData
        };
    }
}

module.exports = new AdminAuthService();
