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
