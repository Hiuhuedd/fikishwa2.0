const { getFirestoreApp } = require('../firebase');
const { doc, getDoc, updateDoc, collection, query, where, getDocs } = require('firebase/firestore');
const configService = require('./configService');
const socketService = require('./socketService');
const smsService = require('./smsService');

const db = getFirestoreApp();

/**
 * Check if driver should be disabled based on owed commission
 */
const checkAndEnforceOwedCommission = async (driverId) => {
    try {
        const config = await configService.getConfig();
        const driverRef = doc(db, 'drivers', driverId);
        const driverDoc = await getDoc(driverRef);

        if (!driverDoc.exists()) {
            throw new Error('Driver not found');
        }

        const driverData = driverDoc.data();
        const owedCommission = driverData.owedCommission || 0;
        const currentStatus = driverData.status || 'active';
        const maxOwed = config.maxOwedCommission || 4000;

        // Check if driver should be disabled
        if (owedCommission > maxOwed && currentStatus === 'active') {
            await updateDoc(driverRef, {
                status: 'disabled'
            });

            // Emit Socket.io event
            socketService.emitToUser(driverId, 'driver-disabled', {
                reason: 'Owed commission exceeded limit',
                owedAmount: owedCommission,
                maxAllowed: maxOwed,
                message: `Your account has been disabled. You owe KES ${owedCommission} in commission. Please settle to reactivate.`
            });

            // Send SMS notification
            await smsService.sendCommissionReminderSMS(
                driverData.phone,
                driverData.name || 'Driver',
                owedCommission,
                maxOwed,
                'DISABLED'
            );

            console.log(`🚫 Driver ${driverId} disabled. Owed: ${owedCommission}, Max: ${maxOwed}`);
            return { disabled: true, owedCommission, maxOwed };
        }

        // Check if driver should be re-enabled
        if (owedCommission <= maxOwed && currentStatus === 'disabled') {
            await updateDoc(driverRef, {
                status: 'active'
            });

            // Emit Socket.io event
            socketService.emitToUser(driverId, 'driver-enabled', {
                message: 'Your account has been reactivated. Thank you for settling your commission.'
            });

            console.log(`✅ Driver ${driverId} re-enabled. Owed: ${owedCommission}`);
            return { enabled: true, owedCommission };
        }

        return { status: currentStatus, owedCommission };
    } catch (error) {
        console.error('❌ Enforcement check failed:', error);
        throw error;
    }
};

/**
 * Check reminder thresholds and send SMS if crossed
 */
const checkReminderThresholds = async (driverId, previousOwed, newOwed) => {
    try {
        const config = await configService.getConfig();
        const thresholds = config.reminderThresholds || [1000, 2000, 3000];

        // Find if we crossed a new threshold
        const crossedThreshold = thresholds.find(
            threshold => previousOwed < threshold && newOwed >= threshold
        );

        if (crossedThreshold) {
            const driverRef = doc(db, 'drivers', driverId);
            const driverDoc = await getDoc(driverRef);

            if (driverDoc.exists()) {
                const driverData = driverDoc.data();

                // Send reminder SMS
                await smsService.sendCommissionReminderSMS(
                    driverData.phone,
                    driverData.name || 'Driver',
                    newOwed,
                    crossedThreshold,
                    'REMINDER'
                );

                // Update last reminder sent
                await updateDoc(driverRef, {
                    lastReminderSent: new Date().toISOString(),
                    lastReminderAmount: newOwed
                });

                console.log(`📬 Reminder sent to driver ${driverId} at threshold ${crossedThreshold}`);
            }
        }
    } catch (error) {
        console.error('❌ Reminder check failed:', error);
        // Don't throw - reminder failure shouldn't block the main flow
    }
};

/**
 * Enforce updated max owed commission on all drivers
 */
const enforceMaxOwedOnAllDrivers = async (newMaxOwed) => {
    try {
        const driversRef = collection(db, 'drivers');
        const q = query(driversRef, where('owedCommission', '>', newMaxOwed));
        const snapshot = await getDocs(q);

        let disabledCount = 0;

        for (const driverDoc of snapshot.docs) {
            const driverId = driverDoc.id;
            const driverData = driverDoc.data();

            if (driverData.status === 'active') {
                await updateDoc(doc(db, 'drivers', driverId), {
                    status: 'disabled'
                });

                // Notify driver
                socketService.emitToUser(driverId, 'driver-disabled', {
                    reason: 'Commission limit updated',
                    owedAmount: driverData.owedCommission,
                    maxAllowed: newMaxOwed
                });

                await smsService.sendCommissionReminderSMS(
                    driverData.phone,
                    driverData.name || 'Driver',
                    driverData.owedCommission,
                    newMaxOwed,
                    'DISABLED'
                );

                disabledCount++;
            }
        }

        console.log(`🚫 Disabled ${disabledCount} drivers due to updated max owed commission`);
        return { disabledCount };
    } catch (error) {
        console.error('❌ Failed to enforce max owed on all drivers:', error);
        throw error;
    }
};

module.exports = {
    checkAndEnforceOwedCommission,
    checkReminderThresholds,
    enforceMaxOwedOnAllDrivers
};
