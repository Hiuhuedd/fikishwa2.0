const { Server } = require('socket.io');

let io;
const userSockets = new Map(); // userId -> socketId

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('New Socket Connection:', socket.id);

        socket.on('join', (data) => {
            const { userId, role } = data; // role: 'customer' or 'driver'
            if (userId) {
                userSockets.set(userId, socket.id);
                socket.join(role); // join role-based rooms
                socket.join(userId); // join user-specific room
                console.log(`User ${userId} (${role}) joined room`);
            }
        });

        socket.on('update-location', async (data) => {
            const { lat, lng, heading, speed } = data;
            const userId = Array.from(userSockets.entries()).find(([_, id]) => id === socket.id)?.[0];

            if (userId) {
                // We could update Firestore here, but for performance 
                // we might just broadcast to interested parties (like the passenger)
                // console.log(`Location update from ${userId}: ${lat}, ${lng}`);
            }
        });

        socket.on('disconnect', () => {
            console.log('Socket Disconnected:', socket.id);
            // Clean up map
            for (let [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    userSockets.delete(userId);
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
        driverIds.forEach(driverId => {
            io.to(driverId).emit(event, data);
        });
    }
};

module.exports = {
    initSocket,
    getIO,
    emitToUser,
    emitToDrivers,
    emitToNearbyDrivers
};
