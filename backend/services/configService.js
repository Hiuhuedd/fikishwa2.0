const { getFirestoreApp } = require('../firebase');
const { doc, getDoc, setDoc, serverTimestamp } = require('firebase/firestore');

const db = getFirestoreApp();
const CONFIG_DOC_ID = 'global';

// Default configuration values
const DEFAULT_CONFIG = {
    commissionRate: 0.03,
    taxRate: 0.16,
    perKmRate: { inperson: 50, parcel: 60 },
    perMinRate: { inperson: 10, parcel: 12 },
    perStopFee: 100,
    baseFare: { inperson: 200, parcel: 250 },
    maxOwedCommission: 4000,
    reminderThresholds: [1000, 2000, 3000],
    surgeMultiplier: 1.0,
    updatedAt: null,
    updatedBy: null
};

// In-memory cache for config
let configCache = null;
let lastCacheUpdate = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Initialize config collection with default values if not exists
 */
const initializeConfig = async () => {
    try {
        const configRef = doc(db, 'adminConfig', CONFIG_DOC_ID);
        const configDoc = await getDoc(configRef);

        if (!configDoc.exists()) {
            await setDoc(configRef, {
                ...DEFAULT_CONFIG,
                updatedAt: serverTimestamp(),
                updatedBy: 'system'
            });
            console.log('✅ Admin config initialized with defaults');
        }
    } catch (error) {
        console.error('❌ Failed to initialize config:', error);
        throw error;
    }
};

/**
 * Get current configuration (with caching)
 */
const getConfig = async (forceRefresh = false) => {
    try {
        const now = Date.now();

        // Return cached config if valid
        if (!forceRefresh && configCache && lastCacheUpdate && (now - lastCacheUpdate < CACHE_TTL)) {
            return configCache;
        }

        const configRef = doc(db, 'adminConfig', CONFIG_DOC_ID);
        const configDoc = await getDoc(configRef);

        if (!configDoc.exists()) {
            await initializeConfig();
            return await getConfig(true);
        }

        configCache = configDoc.data();
        lastCacheUpdate = now;

        return configCache;
    } catch (error) {
        console.error('❌ Failed to get config:', error);
        // Return defaults as fallback
        return DEFAULT_CONFIG;
    }
};

/**
 * Update configuration with validation
 */
const updateConfig = async (updates, adminId) => {
    try {
        // Validate inputs
        if (updates.commissionRate !== undefined) {
            if (updates.commissionRate < 0 || updates.commissionRate > 0.2) {
                throw new Error('Commission rate must be between 0 and 0.2 (20%)');
            }
        }

        if (updates.taxRate !== undefined) {
            if (updates.taxRate < 0 || updates.taxRate >= 0.5) {
                throw new Error('Tax rate must be between 0 and 0.5 (50%)');
            }
        }

        if (updates.maxOwedCommission !== undefined) {
            if (updates.maxOwedCommission <= 0) {
                throw new Error('Max owed commission must be greater than 0');
            }
        }

        if (updates.reminderThresholds !== undefined) {
            if (!Array.isArray(updates.reminderThresholds)) {
                throw new Error('Reminder thresholds must be an array');
            }
            // Validate sorted ascending
            for (let i = 1; i < updates.reminderThresholds.length; i++) {
                if (updates.reminderThresholds[i] <= updates.reminderThresholds[i - 1]) {
                    throw new Error('Reminder thresholds must be sorted in ascending order');
                }
            }
        }

        // Validate rate objects
        const validateRateObject = (obj, name) => {
            if (obj && (obj.inperson === undefined || obj.parcel === undefined)) {
                throw new Error(`${name} must have both 'inperson' and 'parcel' values`);
            }
            if (obj && (obj.inperson <= 0 || obj.parcel <= 0)) {
                throw new Error(`${name} values must be greater than 0`);
            }
        };

        if (updates.perKmRate) validateRateObject(updates.perKmRate, 'perKmRate');
        if (updates.perMinRate) validateRateObject(updates.perMinRate, 'perMinRate');
        if (updates.baseFare) validateRateObject(updates.baseFare, 'baseFare');

        // Update config document
        const configRef = doc(db, 'adminConfig', CONFIG_DOC_ID);
        await setDoc(configRef, {
            ...updates,
            updatedAt: serverTimestamp(),
            updatedBy: adminId
        }, { merge: true });

        // Invalidate cache
        configCache = null;
        lastCacheUpdate = null;

        console.log('✅ Config updated successfully');
        return await getConfig(true);
    } catch (error) {
        console.error('❌ Failed to update config:', error);
        throw error;
    }
};

/**
 * Refresh cache manually
 */
const refreshCache = async () => {
    return await getConfig(true);
};

module.exports = {
    initializeConfig,
    getConfig,
    updateConfig,
    refreshCache,
    DEFAULT_CONFIG
};
