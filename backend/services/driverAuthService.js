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

class DriverAuthService {
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
        const message = `Your Fikishwa Driver verification code is ${otp}. Valid for 5 minutes. Do not share.`;

        await smsService.sendSMS(normalizedPhone, message, "system", "auth_otp_driver");

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

        // Check if driver exists in Firestore
        const driversRef = collection(this.db, 'drivers');
        const q = query(driversRef, where("phone", "==", phone));
        const querySnapshot = await getDocs(q);

        let uid;
        let isNewUser = false;
        let driverDocRef;

        if (!querySnapshot.empty) {
            // Driver exists
            const userDoc = querySnapshot.docs[0];
            uid = userDoc.id;
            driverDocRef = doc(this.db, 'drivers', uid);

            // Update last login
            await updateDoc(driverDocRef, { lastLoginAt: Timestamp.now() });
        } else {
            // New Driver
            isNewUser = true;
            uid = crypto.randomUUID();
            driverDocRef = doc(this.db, 'drivers', uid);

            // Initialize with default values for driver
            await setDoc(driverDocRef, {
                uid: uid,
                phone: phone,
                registrationStatus: 'pending',
                isEnabled: false,
                createdAt: Timestamp.now(),
                lastLoginAt: Timestamp.now(),
                role: 'driver'
            });
        }

        // Fetch final profile
        const finalDoc = await getDoc(driverDocRef);
        const userProfile = finalDoc.data();

        // Generate standard JWT with role: 'driver'
        const token = jwt.sign(
            { uid: uid, phone: phone, role: 'driver' },
            this.jwtSecret,
            { expiresIn: this.jwtExpiresIn }
        );

        return {
            token,
            userProfile,
            isNewUser
        };
    }

    async updateProfile(uid, profileData) {
        const driverDocRef = doc(this.db, 'drivers', uid);
        const docSnap = await getDoc(driverDocRef);

        if (!docSnap.exists()) {
            throw new Error('USER_NOT_FOUND');
        }

        const updatePayload = {};

        // Personal Information
        if (profileData.name) updatePayload.name = profileData.name;
        if (profileData.email) updatePayload.email = profileData.email;
        if (profileData.address) updatePayload.address = profileData.address;

        // Identification Documents (Cloudinary URLs)
        if (profileData.idFrontUrl) updatePayload.idFrontUrl = profileData.idFrontUrl;
        if (profileData.idBackUrl) updatePayload.idBackUrl = profileData.idBackUrl;
        if (profileData.licenseUrl) updatePayload.licenseUrl = profileData.licenseUrl;
        if (profileData.taxCertUrl) updatePayload.taxCertUrl = profileData.taxCertUrl;
        if (profileData.psvBadgeUrl) updatePayload.psvBadgeUrl = profileData.psvBadgeUrl;
        if (profileData.goodConductUrl) updatePayload.goodConductUrl = profileData.goodConductUrl;

        // Car Information
        if (profileData.carMake) updatePayload.carMake = profileData.carMake;
        if (profileData.carModel) updatePayload.carModel = profileData.carModel;
        if (profileData.carYear) updatePayload.carYear = profileData.carYear;
        if (profileData.carImageUrl) updatePayload.carImageUrl = profileData.carImageUrl;
        if (profileData.carRegistrationUrl) updatePayload.carRegistrationUrl = profileData.carRegistrationUrl;

        // Digital Data
        if (profileData.profilePhotoUrl) updatePayload.profilePhotoUrl = profileData.profilePhotoUrl;
        if (profileData.bankName) updatePayload.bankName = profileData.bankName;
        if (profileData.accountNumber) updatePayload.accountNumber = profileData.accountNumber;

        // Agreements
        if (profileData.agreementsAccepted !== undefined) updatePayload.agreementsAccepted = profileData.agreementsAccepted;

        if (Object.keys(updatePayload).length > 0) {
            await updateDoc(driverDocRef, updatePayload);

            // Notify driver that submission is received
            const phone = docSnap.data().phone;
            const message = `Hello ${profileData.name || 'Driver'}, we have received your Fikishwa registration documents. Our team is now reviewing them. You will be notified once your account is approved.`;

            try {
                await smsService.sendSMS(phone, message, "system", "registration_received");
            } catch (smsError) {
                console.error('Failed to send registration confirmation SMS:', smsError.message);
            }
        }

        const updatedDoc = await getDoc(driverDocRef);
        return updatedDoc.data();
    }
    async submitRegistration(uid, profileData) {
        // 1. Update profile with provided data (documents/details) first
        if (profileData && Object.keys(profileData).length > 0) {
            await this.updateProfile(uid, profileData);
        }

        // 2. Fetch the latest profile to validate
        const driverDocRef = doc(this.db, 'drivers', uid);
        const driverDoc = await getDoc(driverDocRef);

        if (!driverDoc.exists()) {
            throw new Error('USER_NOT_FOUND');
        }

        const data = driverDoc.data();

        // 3. Validate Required Fields
        const requiredFields = [
            'idFrontUrl',
            'licenseUrl',
            'goodConductUrl',
            'carImageUrl',
            'carRegistrationUrl' // Logbook
        ];

        const missingFields = requiredFields.filter(field => !data[field]);

        if (missingFields.length > 0) {
            throw new Error(`MISSING_DOCUMENTS: ${missingFields.join(', ')}`);
        }

        // 4. Update Status to 'pending_review'
        await updateDoc(driverDocRef, {
            registrationStatus: 'pending_review',
            status: 'pending', // Ensure it's not active yet
            submittedAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });

        // 5. Send Confirmation SMS
        try {
            const message = `Dear ${data.name || 'Partner'}, your Fikishwa driver application has been submitted successfully. We are reviewing your documents and will notify you once approved.`;
            await smsService.sendSMS(data.phone, message, "system", "submission_confirmed");
        } catch (smsError) {
            console.error('Failed to send submission confirmation SMS:', smsError.message);
        }

        const updatedDoc = await getDoc(driverDocRef);
        return updatedDoc.data();
    }
}

module.exports = new DriverAuthService();
