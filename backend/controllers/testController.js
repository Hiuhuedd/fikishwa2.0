const socketService = require('../services/socketService');

/**
 * Trigger a mock ride request to all online drivers
 */
exports.triggerMockRide = (req, res) => {
    const { driverId } = req.body;

    const mockRide = {
        rideId: 'mock-' + Math.random().toString(36).substr(2, 9),
        pickup: { address: 'Westlands, Nairobi', lat: -1.2633, lng: 36.8021 },
        dropoff: { address: 'Kilimani, Nairobi', lat: -1.2921, lng: 36.7846 },
        fare: 450,
        rideType: 'standard',
        customerName: 'Test Customer',
        distance: '4.2 km',
        estimateTime: '12 min'
    };

    if (driverId) {
        // Send to a specific driver
        socketService.emitToUser(driverId, 'new-ride-request', mockRide);
        console.log(`Mock ride sent to driver: ${driverId}`);
    } else {
        // Send to all online drivers
        socketService.emitToDrivers('new-ride-request', mockRide);
        console.log('Mock ride sent to all online drivers');
    }

    res.json({
        success: true,
        message: 'Mock ride request triggered successfully',
        data: mockRide
    });
};
