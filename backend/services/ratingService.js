const { getFirestoreApp } = require('../firebase');
const { doc, getDoc, updateDoc, runTransaction, arrayUnion } = require('firebase/firestore');

const db = getFirestoreApp();

/**
 * Submit customer rating for driver
 */
const submitCustomerRating = async (rideId, customerId, stars, comment = '') => {
    try {
        const result = await runTransaction(db, async (transaction) => {
            const rideRef = doc(db, 'rides', rideId);
            const rideDoc = await transaction.get(rideRef);

            if (!rideDoc.exists()) {
                throw new Error('Ride not found');
            }

            const rideData = rideDoc.data();

            if (rideData.customerId !== customerId) {
                throw new Error('Unauthorized: This ride does not belong to you');
            }

            if (rideData.status !== 'completed') {
                throw new Error('Cannot rate: Ride is not completed');
            }

            if (rideData.customerRating) {
                throw new Error('You have already rated this ride');
            }

            const driverId = rideData.driverId;
            const driverRef = doc(db, 'drivers', driverId);
            const driverDoc = await transaction.get(driverRef);

            if (!driverDoc.exists()) {
                throw new Error('Driver not found');
            }

            const driverData = driverDoc.data();

            // Update ride with customer rating
            transaction.update(rideRef, {
                customerRating: {
                    stars: stars,
                    comment: comment,
                    ratedAt: new Date().toISOString()
                }
            });

            // Calculate new average rating
            const currentTotal = (driverData.averageRating || 0) * (driverData.totalRatingsCount || 0);
            const newCount = (driverData.totalRatingsCount || 0) + 1;
            const newAverage = (currentTotal + stars) / newCount;

            // Update driver stats
            const recentRatings = driverData.recentRatings || [];
            const updatedRecentRatings = [
                {
                    stars: stars,
                    comment: comment,
                    rideId: rideId,
                    date: new Date().toISOString()
                },
                ...recentRatings
            ].slice(0, 10); // Keep only last 10

            transaction.update(driverRef, {
                averageRating: parseFloat(newAverage.toFixed(2)),
                totalRatingsCount: newCount,
                recentRatings: updatedRecentRatings
            });

            return {
                driverId: driverId,
                newAverage: parseFloat(newAverage.toFixed(2)),
                totalRatings: newCount
            };
        });

        return result;
    } catch (error) {
        console.error('Submit Customer Rating Error:', error);
        throw error;
    }
};

/**
 * Submit driver rating for customer (optional)
 */
const submitDriverRating = async (rideId, driverId, stars, comment = '') => {
    try {
        const result = await runTransaction(db, async (transaction) => {
            const rideRef = doc(db, 'rides', rideId);
            const rideDoc = await transaction.get(rideRef);

            if (!rideDoc.exists()) {
                throw new Error('Ride not found');
            }

            const rideData = rideDoc.data();

            if (rideData.driverId !== driverId) {
                throw new Error('Unauthorized: This ride does not belong to you');
            }

            if (rideData.status !== 'completed') {
                throw new Error('Cannot rate: Ride is not completed');
            }

            if (rideData.driverRating) {
                throw new Error('You have already rated this customer');
            }

            // Update ride with driver rating
            transaction.update(rideRef, {
                driverRating: {
                    stars: stars,
                    comment: comment,
                    ratedAt: new Date().toISOString()
                }
            });

            return {
                customerId: rideData.customerId
            };
        });

        return result;
    } catch (error) {
        console.error('Submit Driver Rating Error:', error);
        throw error;
    }
};

module.exports = {
    submitCustomerRating,
    submitDriverRating
};
