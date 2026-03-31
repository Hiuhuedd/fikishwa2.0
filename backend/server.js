console.log('🏁 Backend server.js starting up...');
const express = require('express');
const http = require('http'); // Added for Socket.io
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const path = require('path');
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

// Render/Heroku Proxy trust
app.set('trust proxy', 1);

// Initialize Socket.io
socketService.initSocket(server);

// Middleware
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? ['https://fikishwa2-0-backend.onrender.com', 'https://fikishwa.app']
        : true, // Allow all in dev
    credentials: true,
};
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request Logger & Route Debugger
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});

// Trace specific /api routes to see if they reach this point
app.use('/api', (req, res, next) => {
    console.log(`📋 API Route Hit: ${req.method} ${req.originalUrl}`);
    next();
});

app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/customer/auth', customerAuthRoutes);
app.use('/api/driver/auth', driverAuthRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/customer/ride', rideRoutes);
app.use('/api/driver/ride', (req, res, next) => {
    console.log(`🚕 [ROUTE TRACE] Entering driverRideRoutes | Method: ${req.method} | Path: ${req.url}`);
    if (!driverRideRoutes) {
        console.error('🔴 driverRideRoutes is undefined in server.js!');
    }
    driverRideRoutes(req, res, next);
});
app.use('/api/admin/config', require('./routes/adminConfigRoutes'));
app.use('/api/admin/payout', require('./routes/adminPayoutRoutes'));
app.use('/api/admin/drivers', require('./routes/adminDriverRoutes'));
app.use('/api/admin/rides', require('./routes/adminRideRoutes'));
app.use('/api/admin/vehicle-categories', require('./routes/adminVehicleCategoryRoutes'));
app.use('/api/driver/payout', require('./routes/driverPayoutRoutes'));
app.use('/api/admin/customers', require('./routes/adminCustomerRoutes'));
app.use('/api/admin/promotions', require('./routes/adminPromotionRoutes'));
app.use('/api/referral', require('./routes/referralRoutes'));
app.use('/api/customer/promo', require('./routes/customerPromoRoutes'));
app.get('/health', (req, res) => {
    res.status(200).json({ success: true, status: 'OK', timestamp: new Date().toISOString() });
});
app.get('/', (req, res) => {
    res.send('Fikishwa Backend API (JWT Mode) is running with Socket.io');
});

// Test/Debug Routes
app.use('/api/test', require('./routes/testRoutes'));

// 404 Handler for /api
app.use('/api', (req, res) => {
    console.log(`🔍 NO ROUTE MATCHED for: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        path: req.originalUrl
    });
});

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
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
