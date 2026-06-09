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

    async sendOtp(identifier, ipAddress) {
        const isEmail = identifier.includes('@');
        let q;
        let normalizedIdentifier;
        const adminsRef = collection(this.db, 'admins');

        if (isEmail) {
            normalizedIdentifier = identifier.toLowerCase().trim();
            q = query(adminsRef, where("email", "==", normalizedIdentifier));
        } else {
            normalizedIdentifier = smsService.normalizePhone(identifier);
            q = query(adminsRef, where("phone", "==", normalizedIdentifier));
        }

        const querySnapshot = await getDocs(q);

        // TEMPORARY BYPASS: Allow any email/phone to receive OTP
        // if (querySnapshot.empty) {
        //     throw new Error('NOT_AUTHORIZED_ADMIN');
        // }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
        const expiresAt = Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000));

        const docRef = await addDoc(collection(this.db, 'otpSessions'), {
            identifier: normalizedIdentifier,
            hashedOtp: hashedOtp,
            attempts: 0,
            expiresAt: expiresAt,
            createdAt: Timestamp.now(),
            ip: ipAddress || 'unknown',
            type: isEmail ? 'email' : 'phone'
        });

        const sessionId = docRef.id;

        if (isEmail) {
            const emailService = require('./emailService');
            await emailService.sendOtpEmail(normalizedIdentifier, otp);
        } else {
            const message = `Your Fikishwa Admin access code is ${otp}. Valid for 5 minutes.`;
            await smsService.sendSMS(normalizedIdentifier, message, "system", "auth_otp_admin");
        }

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

        const identifier = sessionData.identifier || sessionData.phone;
        const isEmail = sessionData.type === 'email' || (identifier && identifier.includes('@'));

        // Final check for admin profile
        const adminsRef = collection(this.db, 'admins');
        let q;
        if (isEmail) {
            q = query(adminsRef, where("email", "==", identifier));
        } else {
            q = query(adminsRef, where("phone", "==", identifier));
        }
        const querySnapshot = await getDocs(q);

        let uid;
        let adminData;

        // TEMPORARY BYPASS: Allow any email/phone to login
        if (querySnapshot.empty) {
            uid = 'temp_admin_' + Date.now();
            adminData = {
                id: uid,
                [isEmail ? 'email' : 'phone']: identifier,
                role: 'admin',
                name: 'Temporary Admin (Bypass)'
            };
        } else {
            const adminDoc = querySnapshot.docs[0];
            uid = adminDoc.id;
            adminData = adminDoc.data();

            // Update last login
            await updateDoc(doc(this.db, 'admins', uid), { lastLoginAt: Timestamp.now() });
        }

        // Generate JWT with role: 'admin'
        const token = jwt.sign(
            { uid: uid, identifier: identifier, role: 'admin' },
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
