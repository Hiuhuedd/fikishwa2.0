const { Server } = require('socket.io');

let io;
const userSockets = new Map(); // userId -> socketId
const driverLocations = new Map(); // Map<userId, {lat, lng, heading, lastUpdate}>

// Mock Data for Testing (only used if no real drivers online)
const MOCK_DRIVER_IDS = new Set(['mock_driver_1', 'mock_driver_2']);
driverLocations.set('mock_driver_1', {
    lat: -1.2864,
    lng: 36.8172,
    heading: 45,
    lastUpdate: new Date().toISOString()
});
driverLocations.set('mock_driver_2', {
    lat: -1.2880,
    lng: 36.8200,
    heading: 180,
    lastUpdate: new Date().toISOString()
});

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        },
        transports: ['websocket', 'polling'] // Explicitly support both
    });

    io.on('connection', (socket) => {
        console.log('New Socket Connection:', socket.id);

        socket.on('join', (data) => {
            const { userId, role, location } = data; // role: 'customer' or 'driver'
            if (userId) {
                userSockets.set(userId, socket.id);
                socket.join(role); // join role-based rooms
                socket.join(userId); // join user-specific room
                console.log(`📡 [Socket] User Joined: ${userId} | Role: ${role} | SocketID: ${socket.id}`);

                if (role === 'driver' && location) {
                    driverLocations.set(userId, {
                        ...location,
                        lastUpdate: new Date().toISOString()
                    });
                }

                // Always broadcast current drivers to everyone in customer room
                const broadcastDriverList = () => {
                    const drivers = Array.from(driverLocations.entries()).map(([id, loc]) => ({
                        driverId: id,
                        location: loc
                    }));
                    io.to('customer').emit('available-drivers', drivers);
                    console.log(`[Socket] Broadcasted ${drivers.length} drivers to customers`);
                };

                // If customer just joined, send them the current list immediately
                if (role === 'customer') {
                    const drivers = Array.from(driverLocations.entries()).map(([id, loc]) => ({
                        driverId: id,
                        location: loc
                    }));
                    console.log(`[Socket] Sending ${drivers.length} drivers to new customer ${userId}`);
                    socket.emit('available-drivers', drivers);
                }

                // If driver just joined, broadcast updated list to all customers
                if (role === 'driver') {
                    broadcastDriverList();
                }
            }
        });

        socket.on('update-location', async (data) => {
            const { lat, lng, heading, speed } = data;
            const userId = Array.from(userSockets.entries()).find(([_, id]) => id === socket.id)?.[0];
            const role = socket.rooms.has('driver') ? 'driver' : 'customer';

            if (userId && role === 'driver') {
                // Update driver location registry
                driverLocations.set(userId, {
                    lat,
                    lng,
                    heading,
                    speed,
                    lastUpdate: new Date().toISOString()
                });

                // Broadcast to all customers
                const drivers = Array.from(driverLocations.entries()).map(([id, loc]) => ({
                    driverId: id,
                    location: loc
                }));
                io.to('customer').emit('available-drivers', drivers);

                // console.log(`Location update from driver ${userId}: ${lat}, ${lng}`);
            }
        });

        socket.on('disconnect', () => {
            console.log('Socket Disconnected:', socket.id);
            // Find which userId this socket belonged to
            for (let [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    userSockets.delete(userId);
                    // Only remove from available drivers if it was a real driver (not mock)
                    if (!MOCK_DRIVER_IDS.has(userId)) {
                        driverLocations.delete(userId);
                    }

                    // Notify customers of the updated list
                    const drivers = Array.from(driverLocations.entries()).map(([id, loc]) => ({
                        driverId: id,
                        location: loc
                    }));
                    io.to('customer').emit('available-drivers', drivers);
                    console.log(`[Socket] Driver ${userId} disconnected. Remaining: ${drivers.length}`);
                    break;
                }
            }
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

/**
 * Emit event to a specific user
 */
const emitToUser = (userId, event, data) => {
    if (io) {
        io.to(userId).emit(event, data);
    }
};

/**
 * Emit event to all drivers
 */
const emitToDrivers = (event, data) => {
    if (io) {
        io.to('driver').emit(event, data);
    }
};

/**
 * Emit event to multiple specific drivers
 */
const emitToNearbyDrivers = (driverIds, event, data) => {
    if (io) {
        console.log(`📡 [Socket] emitToNearbyDrivers: Attempting to notify ${driverIds.length} drivers: ${driverIds.join(', ')}`);
        driverIds.forEach(driverId => {
            const socketId = userSockets.get(driverId);
            if (socketId) {
                console.log(`   - Emitting '${event}' to driver ${driverId} (socket: ${socketId})`);
                io.to(driverId).emit(event, data);
            } else {
                console.warn(`   - ⚠️ Driver ${driverId} is NOT in userSockets map. Skipping emission.`);
            }
        });
    } else {
        console.error('🔴 [Socket] emitToNearbyDrivers: Socket.io not initialized!');
    }
};

const getAvailableDrivers = () => {
    return Array.from(driverLocations.entries()).map(([id, loc]) => ({
        driverId: id,
        location: loc
    }));
};

module.exports = {
    initSocket,
    getIO,
    emitToUser,
    emitToDrivers,
    emitToNearbyDrivers,
    getAvailableDrivers
};
