const rideService = require('../services/rideService');

/**
 * Get ride statistics
 */
exports.getRideStats = async (req, res) => {
    try {
        const stats = await rideService.getRideStatistics();
        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get paginated list of rides
 */
exports.getAllRides = async (req, res) => {
    try {
        const { limit = 20, lastDocId } = req.query;
        const result = await rideService.getAllRides(parseInt(limit), lastDocId);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get ride by ID
 */
exports.getRideById = async (req, res) => {
    try {
        const { rideId } = req.params;
        const ride = await rideService.getRideById(rideId);
        
        if (!ride) {
            return res.status(404).json({ success: false, message: 'Ride not found' });
        }
        
        res.json({ success: true, ride });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
