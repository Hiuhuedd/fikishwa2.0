const { getFirestoreApp } = require('../firebase');
const {
    collection, query, where, getDocs, orderBy, limit, startAfter,
    doc, getDoc, runTransaction, serverTimestamp, setDoc
} = require('firebase/firestore');
const smsService = require('../services/smsService');
const socketService = require('../services/socketService');

const db = getFirestoreApp();

/**
 * List pending drivers
 */
exports.getPendingDrivers = async (req, res) => {
    try {
        const driversRef = collection(db, 'drivers');
        const q = query(
            driversRef,
            where('registrationStatus', '==', 'pending_review'),
            orderBy('updatedAt', 'desc'), // Sort by most recently updated profile
            limit(50)
        );

        const snapshot = await getDocs(q);
        const drivers = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            drivers.push({
                driverId: doc.id,
                name: data.name || 'Unknown',
                phone: data.phone,
                submittedAt: data.updatedAt ? data.updatedAt.toDate() : null,
                vehicle: {
                    make: data.carMake,
                    model: data.carModel,
                    year: data.carYear
                },
                // Include doc links for quick preview if needed
                documents: {
                    idFront: data.idFrontUrl,
                    license: data.licenseUrl
                }
            });
        });

        res.json({
            success: true,
            drivers,
            count: drivers.length
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * List all drivers with filters
 */
exports.getAllDrivers = async (req, res) => {
    try {
        const { status, search } = req.query;
        const driversRef = collection(db, 'drivers');

        let q = query(driversRef, orderBy('createdAt', 'desc'), limit(50));

        if (status && status !== 'all') {
            q = query(
                driversRef,
                where('registrationStatus', '==', status),
                orderBy('updatedAt', 'desc'),
                limit(50)
            );
        }

        // Note: Firestore doesn't support native partial text search. 
        // For production, integrate Algolia or Typesense. 
        // For now, we fetch limited set and filter in memory if 'search' is present, or just trust simple filters.

        const snapshot = await getDocs(q);
        let drivers = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            drivers.push({
                driverId: doc.id,
                name: data.name || 'Unknown',
                phone: data.phone,
                status: data.status,
                registrationStatus: data.registrationStatus,
                joinedAt: data.createdAt ? data.createdAt.toDate() : null
            });
        });

        if (search) {
            const lowerSearch = search.toLowerCase();
            drivers = drivers.filter(d =>
                d.name.toLowerCase().includes(lowerSearch) ||
                d.phone.includes(search)
            );
        }

        res.json({
            success: true,
            drivers
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get detailed driver view
 */
exports.getDriverDetails = async (req, res) => {
    try {
        const { driverId } = req.params;
        const driverRef = doc(db, 'drivers', driverId);
        const driverDoc = await getDoc(driverRef);

        if (!driverDoc.exists()) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }

        res.json({
            success: true,
            driver: {
                driverId: driverDoc.id,
                ...driverDoc.data()
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Approve driver registration
 */
exports.approveDriver = async (req, res) => {
    try {
        const { driverId } = req.params;
        const { notes, approvedCategories } = req.body;
        const adminId = req.user.uid;

        const driverRef = doc(db, 'drivers', driverId);
        const logRef = doc(collection(db, 'driverReviewLogs'));

        const updatedDriver = await runTransaction(db, async (transaction) => {
            const driverDoc = await transaction.get(driverRef);
            if (!driverDoc.exists()) throw new Error('Driver not found');

            const data = driverDoc.data();

            // Check if disabled due to commission debt, preserve that valid 'disabled' status if needed?
            // Prompt says: status -> "active" (unless disabled by commission debt).
            // We can check owedCommission vs maxOwed commission logic here, or assume approval means fresh start or admin override.
            // Let's assume approval sets them active unless they ALREADY have massive debt, which new drivers shouldn't.

            let newStatus = 'active';
            if (data.owedCommission > 4000) { // Should use dynamic config, but safety check
                newStatus = 'disabled';
            }

            const updates = {
                registrationStatus: 'approved',
                status: newStatus,
                approvedCategories: approvedCategories || ['standard'], // Default to standard if not provided
                approvedAt: serverTimestamp(),
                reviewedBy: adminId,
                reviewedAt: serverTimestamp(),
                rejectedReason: null // Clear any previous rejection
            };

            transaction.update(driverRef, updates);

            // Create audit log
            transaction.set(logRef, {
                driverId,
                adminId,
                action: 'approve',
                notes: notes || 'Documents valid',
                timestamp: serverTimestamp(),
                previousStatus: data.registrationStatus
            });

            // Return necessary data for post-transaction actions
            return {
                name: data.name,
                phone: data.phone,
                newStatus,
                registrationStatus: 'approved'
            };
        });

        // Notifications
        // 1. Socket.io
        socketService.emitToUser(driverId, 'account-status-changed', {
            registrationStatus: 'approved',
            status: updatedDriver.newStatus, // active
            message: "Your account has been verified and approved!"
        });

        // 2. SMS
        await smsService.generateDriverApprovalSMS(updatedDriver.name, updatedDriver.phone);

        res.json({
            success: true,
            message: 'Driver approved successfully',
            status: updatedDriver.newStatus
        });
    } catch (error) {
        console.error('Approve Driver Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Reject driver registration
 */
exports.rejectDriver = async (req, res) => {
    try {
        const { driverId } = req.params;
        const { reason } = req.body;
        const adminId = req.user.uid;

        if (!reason) {
            return res.status(400).json({ success: false, message: 'Rejection reason is required' });
        }

        const driverRef = doc(db, 'drivers', driverId);
        const logRef = doc(collection(db, 'driverReviewLogs'));

        const updatedDriver = await runTransaction(db, async (transaction) => {
            const driverDoc = await transaction.get(driverRef);
            if (!driverDoc.exists()) throw new Error('Driver not found');

            const data = driverDoc.data();

            const updates = {
                registrationStatus: 'rejected',
                status: 'disabled',
                rejectedReason: reason,
                reviewedBy: adminId,
                reviewedAt: serverTimestamp()
            };

            transaction.update(driverRef, updates);

            // Audit log
            transaction.set(logRef, {
                driverId,
                adminId,
                action: 'reject',
                reason,
                timestamp: serverTimestamp(),
                previousStatus: data.registrationStatus
            });

            return {
                name: data.name,
                phone: data.phone
            };
        });

        // Notifications
        // 1. Socket.io
        socketService.emitToUser(driverId, 'account-status-changed', {
            registrationStatus: 'rejected',
            status: 'disabled',
            rejectedReason: reason,
            message: `Your account application was rejected: ${reason}`
        });

        // 2. SMS
        await smsService.generateDriverRejectionSMS(updatedDriver.name, updatedDriver.phone, reason);

        res.json({
            success: true,
            message: 'Driver rejected successfully'
        });
    } catch (error) {
        console.error('Reject Driver Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
/**
 * Update driver category
 */
exports.updateDriverCategory = async (req, res) => {
    try {
        const { driverId } = req.params;
        const { categoryId } = req.body;

        if (!categoryId) {
            return res.status(400).json({ success: false, message: 'Category ID is required' });
        }

        const driverRef = doc(db, 'drivers', driverId);
        await runTransaction(db, async (transaction) => {
            const driverDoc = await transaction.get(driverRef);
            if (!driverDoc.exists()) throw new Error('Driver not found');

            const driverData = driverDoc.data();
            let approvedCategories = driverData.approvedCategories || [];

            // Add if not exists, or replace? 
            // Usually drivers have one primary vehicle type, or a list of allowed types.
            // Let's assume we are setting the PRIMARY vehicle type + ensuring it's in approved list.

            if (!approvedCategories.includes(categoryId)) {
                approvedCategories.push(categoryId);
            }

            transaction.update(driverRef, {
                vehicleType: categoryId, // Update primary display type
                approvedCategories: approvedCategories,
                updatedAt: serverTimestamp()
            });
        });

        res.json({ success: true, message: 'Driver category updated successfully' });
    } catch (error) {
        console.error('Update Driver Category Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
