const { getFirestoreApp } = require('../firebase');
const {
    getDoc,
    doc,
    updateDoc,
    Timestamp
} = require('firebase/firestore');
const smsService = require('./smsService');

class AdminActionsService {
    constructor() {
        this.db = getFirestoreApp();
    }

    /**
     * Admin: Verify Driver (Approve/Reject)
     * @param {string} uid 
     * @param {string} status - 'approved' | 'rejected'
     * @param {string} reason - optional reason for rejection
     */
    async verifyDriver(uid, status, reason = '') {
        const driverDocRef = doc(this.db, 'drivers', uid);
        const docSnap = await getDoc(driverDocRef);

        if (!docSnap.exists()) {
            throw new Error('USER_NOT_FOUND');
        }

        const currentData = docSnap.data();
        const phone = currentData.phone;

        const updatePayload = {
            registrationStatus: status,
            verificationReason: reason,
            verifiedAt: Timestamp.now()
        };

        if (status === 'approved') {
            updatePayload.isEnabled = true;
        } else {
            updatePayload.isEnabled = false;
        }

        await updateDoc(driverDocRef, updatePayload);

        // Send Notification SMS
        let message;
        if (status === 'approved') {
            message = `Congratulations! Your Fikishwa Driver registration has been approved. You can now open the app and begin trips.`;
        } else {
            message = `Your Fikishwa Driver registration has been rejected. Reason: ${reason || 'Incomplete documents'}. Please contact support.`;
        }

        await smsService.sendSMS(phone, message, "admin", "driver_verification");

        return { success: true, status, uid };
    }

    /**
     * Admin: Enable or Disable Driver
     * @param {string} uid 
     * @param {boolean} isEnabled 
     */
    async toggleDriverStatus(uid, isEnabled) {
        const driverDocRef = doc(this.db, 'drivers', uid);
        const docSnap = await getDoc(driverDocRef);

        if (!docSnap.exists()) {
            throw new Error('USER_NOT_FOUND');
        }

        await updateDoc(driverDocRef, { isEnabled });

        // Send Notification SMS
        const phone = docSnap.data().phone;
        const message = isEnabled
            ? `Your Fikishwa Driver account has been enabled. You can now go online and receive rides.`
            : `Your Fikishwa Driver account has been disabled. Please contact support for assistance.`;

        try {
            await smsService.sendSMS(phone, message, "admin", "driver_status_toggle");
        } catch (smsError) {
            console.error('Failed to send status toggle SMS:', smsError.message);
        }

        return { success: true, isEnabled, uid };
    }
}

module.exports = new AdminActionsService();
