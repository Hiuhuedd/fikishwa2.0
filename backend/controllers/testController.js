const socketService = require('../services/socketService');

const { getFirestoreApp } = require('../firebase');
const { doc, setDoc, serverTimestamp, collection, addDoc } = require('firebase/firestore');

const db = getFirestoreApp();

/**
 * Trigger a mock ride for testing
 */
exports.triggerMockRide = async (req, res) => {
    const { driverId } = req.body;

    try {
        const rideId = 'mock-' + Math.random().toString(36).substr(2, 9);
        const pickup = { address: 'Westlands, Nairobi', lat: -1.2633, lng: 36.8021 };
        const dropoff = { address: 'Kilimani, Nairobi', lat: -1.2921, lng: 36.7846 };
        const fare = 450;

        // 1. Create the ride in Firestore so it can be accepted/started/completed
        await setDoc(doc(db, 'rides', rideId), {
            customerId: 'test-customer-123',
            customerName: 'Test Customer',
            pickup,
            dropoff,
            rideType: 'standard',
            status: 'searching',
            estimatedFare: fare,
            distanceKm: 4.2,
            durationMin: 12,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // 2. Create the ride request (required by acceptRide transaction)
        await setDoc(doc(db, 'rideRequests', rideId), {
            rideId,
            pickup,
            rideType: 'standard',
            estimatedFare: fare,
            createdAt: serverTimestamp()
        });

        const mockRide = {
            rideId,
            pickup,
            dropoff,
            fare,
            rideType: 'standard',
            customerName: 'Test Customer',
            distance: '4.2 km',
            estimateTime: '12 min'
        };

        if (driverId) {
            socketService.emitToUser(driverId, 'new-ride-request', mockRide);
            console.log(`Mock ride sent to driver: ${driverId}`);
        } else {
            socketService.emitToDrivers('new-ride-request', mockRide);
            console.log('Mock ride sent to all online drivers');
        }

        res.json({ success: true, message: 'Mock ride created and broadcasted', ride: mockRide });
    } catch (error) {
        console.error('Mock ride error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
