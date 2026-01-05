const configService = require('../services/configService');
const commissionEnforcement = require('../services/commissionEnforcementService');

/**
 * Get current configuration
 */
exports.getConfig = async (req, res) => {
    try {
        const config = await configService.getConfig();
        res.json({ success: true, config });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Update configuration
 */
exports.updateConfig = async (req, res) => {
    try {
        const updates = req.body;
        const adminId = req.user.uid;

        // Check for maxOwedCommission change to trigger enforcement
        const currentConfig = await configService.getConfig();
        const oldMaxOwed = currentConfig.maxOwedCommission;

        const newConfig = await configService.updateConfig(updates, adminId);

        // If max owed commission changed, enforce on all drivers
        if (updates.maxOwedCommission && updates.maxOwedCommission !== oldMaxOwed) {
            // Run asynchronously to not block response
            commissionEnforcement.enforceMaxOwedOnAllDrivers(updates.maxOwedCommission)
                .then(result => console.log(`Enforcement complete. Disabled: ${result.disabledCount}`))
                .catch(err => console.error('Enforcement failed:', err));
        }

        res.json({
            success: true,
            message: 'Configuration updated successfully',
            config: newConfig
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
