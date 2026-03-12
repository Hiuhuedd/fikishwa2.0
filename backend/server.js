console.log('🏁 Backend server.js starting up...');
const express = require('express');
const http = require('http'); // Added for Socket.io
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Note: Firebase Client initialization happens in ./firebase.js
// which is imported by the services.

const customerAuthRoutes = require('./routes/customerAuthRoutes');
const driverAuthRoutes = require('./routes/driverAuthRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const rideRoutes = require('./routes/rideRoutes');
const driverRideRoutes = require('./routes/driverRideRoutes');

const socketService = require('./services/socketService');

const app = express();
const server = http.createServer(app); // Created http server
const PORT = process.env.PORT || 3000;

// Initialize Socket.io
socketService.initSocket(server);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/customer/auth', customerAuthRoutes);
app.use('/api/driver/auth', driverAuthRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/customer/ride', rideRoutes);
app.use('/api/driver/ride', driverRideRoutes);
app.use('/api/admin/config', require('./routes/adminConfigRoutes'));
app.use('/api/admin/payout', require('./routes/adminPayoutRoutes'));
app.use('/api/admin/drivers', require('./routes/adminDriverRoutes'));
app.use('/api/driver/payout', require('./routes/driverPayoutRoutes'));
app.use('/api/admin/customers', require('./routes/adminCustomerRoutes'));
app.use('/api/admin/promotions', require('./routes/adminPromotionRoutes'));
app.use('/api/customer/promo', require('./routes/customerPromoRoutes'));
app.get('/', (req, res) => {
    res.send('Fikishwa Backend API (JWT Mode) is running with Socket.io');
});

// Test/Debug Routes
app.use('/api/test', require('./routes/testRoutes'));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('🔴 GLOBAL ERROR CAUGHT:', err);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error (Global Handler)',
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start Server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
