const { getFirestoreApp } = require('../firebase');
const {
    collection, addDoc, updateDoc, doc, serverTimestamp,
    getDoc, setDoc, deleteDoc, runTransaction, getDocs, query, orderBy, limit, startAfter
} = require('firebase/firestore');
const geoService = require('./geoService');
const fareService = require('./fareService');
const matchingService = require('./matchingService');
const socketService = require('./socketService');
const ngeohash = require('ngeohash');

const db = getFirestoreApp();

/**
 * Request a ride
 */
const requestRide = async (customerData) => {
    const {
        customerId, pickup, stops, dropoff, rideType, paymentMethod, promoCode, vehicleCategory
    } = customerData;

    try {
        // 1. Get accurate route and distance
        const routeData = await geoService.getRoute(pickup, stops, dropoff);

        // 2. Calculate fare (with promo and category)
        const estimate = await fareService.calculateEstimate(
            routeData.distance,
            routeData.duration,
            stops.length,
            rideType,
            promoCode,
            customerId,
            vehicleCategory
        );

        // 3. Create Ride document
        const rideRef = await addDoc(collection(db, 'rides'), {
            customerId,
            pickup,
            stops: stops || [],
            dropoff,
            rideType,
            vehicleCategory: vehicleCategory || 'standard', // Store category
            paymentMethod,
            status: 'searching',
            estimatedFare: estimate.estimatedFare,
            originalFare: estimate.originalFare, // Track original
            discountAmount: estimate.discountAmount, // Track discount
            appliedPromoCode: estimate.appliedPromoCode,
            distanceKm: estimate.distanceKm,
            durationMin: estimate.durationMin,
            routePolyline: routeData.geometry,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        const rideId = rideRef.id;

        // 4. Create temporary ride request for matching
        const pickupGeohash = ngeohash.encode(pickup.lat, pickup.lng, 6);
        await setDoc(doc(db, 'rideRequests', rideId), {
            rideId,
            pickup,
            geohash: pickupGeohash,
            rideType,
            vehicleCategory: vehicleCategory || null,
            estimatedFare: estimate.estimatedFare,
            createdAt: serverTimestamp()
        });

        // 5. Find nearby drivers (filtered by category) and notify
        const nearbyDrivers = await matchingService.findNearbyDrivers(pickup, 10, vehicleCategory);
        const driverIds = nearbyDrivers.map(d => d.id);

        socketService.emitToNearbyDrivers(driverIds, 'new-ride-request', {
            rideId,
            pickup,
            stops,
            dropoff,
            rideType,
            vehicleCategory, // Send to driver to show category
            fare: estimate.estimatedFare,
            customerName: customerData.customerName || 'Customer'
        });

        // 6. Set auto-cancel timeout (90 seconds)
        setTimeout(async () => {
            const currentRide = await getDoc(doc(db, 'rides', rideId));
            if (currentRide.exists() && currentRide.data().status === 'searching') {
                await updateDoc(doc(db, 'rides', rideId), {
                    status: 'cancelled_no_drivers',
                    updatedAt: serverTimestamp()
                });
                await deleteDoc(doc(db, 'rideRequests', rideId));
                socketService.emitToUser(customerId, 'ride-status-update', {
                    status: 'cancelled_no_drivers',
                    message: 'No drivers found nearby'
                });
            }
        }, 90000);

        return { rideId, ...estimate };
    } catch (error) {
        console.error('Request Ride Error:', error);
        throw error;
    }
};

/**
 * Accept a ride (Driver Side - Transactional)
 */
const acceptRide = async (rideId, driverId, driverDetails) => {
    try {
        const rideRef = doc(db, 'rides', rideId);
        const requestRef = doc(db, 'rideRequests', rideId);

        const result = await runTransaction(db, async (transaction) => {
            console.log('Accepting ride transaction for ID:', rideId);
            const rideDoc = await transaction.get(rideRef);
            if (!rideDoc.exists()) {
                console.error('Ride document NOT FOUND in Firestore for ID:', rideId);
                throw new Error('Ride does not exist');
            }

            const rideData = rideDoc.data();
            console.log('Ride found. Current status:', rideData.status);
            if (rideData.status !== 'searching') {
                throw new Error('Ride is already ' + rideData.status);
            }

            // Update ride
            transaction.update(rideRef, {
                status: 'accepted',
                driverId: driverId,
                driverDetails: driverDetails,
                acceptedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Delete temporary request
            transaction.delete(requestRef);

            return {
                customerId: rideData.customerId,
                rideData: rideData
            };
        });

        // Notify customer
        socketService.emitToUser(result.customerId, 'ride-matched', {
            rideId,
            status: 'accepted',
            driverDetails: driverDetails
        });

        return result.rideData;
    } catch (error) {
        console.error('Accept Ride Error:', error);
        throw error;
    }
};

/**
 * Update ride status
 */
const updateRideStatus = async (rideId, status, extraData = {}) => {
    try {
        const rideRef = doc(db, 'rides', rideId);
        await updateDoc(rideRef, {
            status,
            ...extraData,
            updatedAt: serverTimestamp()
        });

        const rideDoc = await getDoc(rideRef);
        const rideData = rideDoc.data();

        // Notify customer
        socketService.emitToUser(rideData.customerId, 'ride-status-update', {
            rideId,
            status,
            ...extraData
        });

        return rideData;
    } catch (error) {
        console.error('Update Ride Status Error:', error);
        throw error;
    }
};

/**
 * Complete a ride with actual metrics and commission tracking
 */
const completeRide = async (rideId, driverId, actualDistanceKm, actualDurationMin) => {
    const smsService = require('./smsService');
    const commissionEnforcement = require('./commissionEnforcementService');

    try {
        const rideRef = doc(db, 'rides', rideId);
        const driverRef = doc(db, 'drivers', driverId);

        const result = await runTransaction(db, async (transaction) => {
            const rideDoc = await transaction.get(rideRef);
            if (!rideDoc.exists()) throw new Error('Ride does not exist');

            const rideData = rideDoc.data();

            if (rideData.driverId !== driverId) {
                throw new Error('Unauthorized: This ride does not belong to you');
            }

            if (rideData.status !== 'in_progress') {
                throw new Error('Ride is not in progress');
            }

            // Recalculate final fare with actuals + promo check
            // Note: We need to know if a promo was applied during request.
            // Assuming rideData.appliedPromoCode exists if applied during request.

            const finalFareData = await fareService.calculateFinalFare(
                actualDistanceKm * 1000,
                actualDurationMin * 60,
                (rideData.stops || []).length,
                rideData.rideType,
                rideData.appliedPromoCode,
                rideData.customerId
            );

            // Calculate commission based on DISCOUNTED fare (or original? usually discounted)
            // Let's assume commission is on the amount the driver actually collects/receives
            // But if it's a "free ride" promo, driver still needs to be paid.
            // STRATEGY: Commission is on the ORIGINAL fare to ensure platform revenue is calculated correctly,
            // or on the FINAL fare. 
            // Better: Commission is on the "Real Value" of the ride. Driver gets full share.
            // If user pays 0 (Free Ride), Company owes Driver the full amount - Commission.
            // For now, simpler approach: Commission on Final Fare.
            // ADJUSTMENT: If user has a discount, usually the company subsidizes it.
            // So Driver Share should be calculated on ORIGINAL fare.

            const originalFare = finalFareData.originalFare || finalFareData.estimatedFare;
            const commissionData = await fareService.calculateCommission(originalFare);

            // If promo applied, Company owes Driver the discount amount (subsidized)
            // effectiveDriverEarnings = DriverShare(based on Original)
            // UserPays = FinalFare (Discounted)
            // If Direct-to-Driver: Driver collects UserPays. 
            //   Driver should have collected OriginalFare. Shortfall = Discount.
            //   Company owes Driver: Discount.
            //   Driver owes Company: Commission.
            //   Net: DriverOwes = Commission - Discount.

            // Update ride to completed
            transaction.update(rideRef, {
                status: 'completed',
                finalFare: finalFareData.estimatedFare, // What user pays/is charged
                originalFare: originalFare,
                discountAmount: finalFareData.discountAmount || 0,
                appliedPromoCode: finalFareData.appliedPromoCode || null,
                actualDistanceKm: actualDistanceKm,
                actualDurationMin: actualDurationMin,
                commission: commissionData.totalCommission,
                driverShare: commissionData.driverShare,
                completedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Handle Promo Usage Count
            if (finalFareData.appliedPromoCode) {
                const promotionService = require('./promotionService');
                await promotionService.redeemPromotion(finalFareData.appliedPromoCode, rideData.customerId, rideId);
            }

            // Update driver stats
            const driverDoc = await transaction.get(driverRef);
            const driverData = driverDoc.exists() ? driverDoc.data() : {};

            const currentTotalRides = driverData.totalRides || 0;
            const currentTotalEarnings = driverData.totalEarnings || 0;
            const weeklyTripCount = (driverData.weeklyTripCount || 0) + 1;
            const payoutPreference = driverData.payoutPreference || 'direct-to-driver';
            const previousOwed = driverData.owedCommission || 0;
            const previousPending = driverData.pendingPayout || 0;

            let updates = {
                totalRides: currentTotalRides + 1,
                weeklyTripCount: weeklyTripCount,
                totalEarnings: currentTotalEarnings + commissionData.driverShare
            };

            // Commission & Payout Logic with Promo handling
            let owedChange = 0;
            let pendingChange = 0;

            if (payoutPreference === 'direct-to-driver') {
                // Driver collected FinalFare (User Pays)
                // Driver SHOULD have kept DriverShare.
                // Surplus/Deficit = Collected - DriverShare
                // e.g. Ride 1000, Comm 100, DriverShare 900.
                // Case A: No Promo. User pays 1000. Driver has 1000. Driver owes 100.
                // Case B: 50% Promo. User pays 500. Driver has 500. Driver should have 900.
                //         Driver is SHORT 400.
                //         Driver owes 100 commission.
                //         Net: Driver owes 100 - 400 = -300 (Company owes Driver 300).

                const collectedByDriver = finalFareData.estimatedFare;
                const driverShouldKeep = commissionData.driverShare;

                // Positive = Driver owes company. Negative = Company owes driver.
                owedChange = collectedByDriver - driverShouldKeep;

                updates.owedCommission = previousOwed + owedChange;
            } else {
                // App-managed. Company collects FinalFare.
                // Company owes driver DriverShare.
                pendingChange = commissionData.driverShare;
                updates.pendingPayout = previousPending + pendingChange;
            }

            // Check Driver Bonus (Simple Config: 20 trips = 500 KES)
            // Ideally fetch from admin config
            const BONUS_THRESHOLD = 20;
            const BONUS_AMOUNT = 500;
            let bonusAwarded = false;

            if (weeklyTripCount % BONUS_THRESHOLD === 0) {
                // Award bonus
                const bonus = {
                    type: 'driver_completion',
                    value: BONUS_AMOUNT,
                    description: `Bonus for completing ${weeklyTripCount} trips`,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                };

                const currentBonuses = driverData.earnedBonuses || [];
                currentBonuses.push({ ...bonus, id: Math.random().toString(36).substr(2, 9), used: false, issuedAt: new Date().toISOString() });
                updates.earnedBonuses = currentBonuses;
                bonusAwarded = true;
            }

            transaction.update(driverRef, updates);

            // Update customer stats
            const customerRef = doc(db, 'customers', rideData.customerId);
            const customerDoc = await transaction.get(customerRef);

            if (customerDoc.exists()) {
                const customerData = customerDoc.data();
                const summary = customerData.rideHistorySummary || { totalRides: 0, totalSpent: 0 };

                transaction.update(customerRef, {
                    rideHistorySummary: {
                        totalRides: summary.totalRides + 1,
                        totalSpent: summary.totalSpent + finalFareData.estimatedFare
                    }
                });
            }

            return {
                customerId: rideData.customerId,
                customerPhone: rideData.customerPhone || null,
                driverId: driverId,
                driverName: rideData.driverDetails?.name || 'Your Driver',
                driverPhone: driverData.phone,
                finalFare: finalFareData.estimatedFare,
                discountAmount: finalFareData.discountAmount,
                commission: commissionData.totalCommission,
                driverShare: commissionData.driverShare,
                payoutPreference,
                previousOwed,
                newOwed: updates.owedCommission || previousOwed,
                bonusAwarded,
                weeklyTripCount,
                rideData: {
                    ...rideData,
                    finalFare: finalFareData.estimatedFare,
                    actualDistanceKm,
                    actualDurationMin,
                    commission: commissionData.totalCommission
                }
            };
        });

        // Emit completion events via Socket.io
        socketService.emitToUser(result.customerId, 'ride-completed', {
            rideId,
            finalFare: result.finalFare,
            actualDistanceKm,
            actualDurationMin
        });

        socketService.emitToUser(driverId, 'ride-completed', {
            rideId,
            finalFare: result.finalFare,
            commission: result.commission,
            driverShare: result.driverShare
        });

        // Send SMS bill summary to customer (include discount info)
        if (result.customerPhone) {
            await smsService.sendTripCompletionSMS(
                result.rideData,
                result.customerPhone,
                result.driverName
            );

            // Notify if promo was used
            if (result.discountAmount > 0) {
                await smsService.generatePromoAppliedSMS(result.customerPhone, result.discountAmount);
            }
        }

        // Notify driver if bonus won
        if (result.bonusAwarded && result.driverPhone) {
            const BONUS_AMOUNT = 500; // Keep in sync
            await smsService.generateDriverBonusSMS(result.driverName, result.driverPhone, BONUS_AMOUNT, result.weeklyTripCount);
        }

        // For direct-to-driver: Check commission enforcement and reminders
        if (result.payoutPreference === 'direct-to-driver') {
            // Check reminder thresholds
            await commissionEnforcement.checkReminderThresholds(
                driverId,
                result.previousOwed,
                result.newOwed
            );

            // Check if driver should be disabled
            await commissionEnforcement.checkAndEnforceOwedCommission(driverId);
        }

        return result.rideData;
    } catch (error) {
        console.error('Complete Ride Error:', error);
        throw error;
    }
};

/**
 * Get Ride Statistics (Admin)
 */
const getRideStatistics = async () => {
    try {
        const q = query(collection(db, 'rides'));
        const snapshot = await getDocs(q);

        let totalRides = 0;
        let activeRides = 0;
        let completedRides = 0;
        let cancelledRides = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            totalRides++;
            if (['searching', 'accepted', 'in_progress', 'arrived', 'started'].includes(data.status)) {
                activeRides++;
            } else if (data.status === 'completed') {
                completedRides++;
            } else if (data.status === 'cancelled' || data.status === 'cancelled_no_drivers') {
                cancelledRides++;
            }
        });

        return {
            totalRides,
            activeRides,
            completedRides,
            cancelledRides
        };
    } catch (error) {
        console.error('Get Ride Stats Error:', error);
        throw error;
    }
};

/**
 * Get All Rides (Admin - Paginated)
 */
const getAllRides = async (limitNum = 20, lastDocId = null) => {
    try {
        let q = query(
            collection(db, 'rides'),
            orderBy('createdAt', 'desc'),
            limit(limitNum)
        );

        if (lastDocId) {
            const lastDocSnap = await getDoc(doc(db, 'rides', lastDocId));
            if (lastDocSnap.exists()) {
                q = query(
                    collection(db, 'rides'),
                    orderBy('createdAt', 'desc'),
                    startAfter(lastDocSnap),
                    limit(limitNum)
                );
            }
        }

        const snapshot = await getDocs(q);
        const rides = [];
        snapshot.forEach(doc => {
            rides.push({ rideId: doc.id, ...doc.data() });
        });

        return {
            rides,
            lastDocId: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
            hasMore: snapshot.docs.length === limitNum
        };
    } catch (error) {
        console.error('Get All Rides Error:', error);
        throw error;
    }
};

module.exports = {
    requestRide,
    acceptRide,
    updateRideStatus,
    completeRide,
    getRideStatistics,
    getAllRides
};
