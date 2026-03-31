/**
 * Fare Calculation Service with Dynamic Config
 */

const configService = require('./configService');

// Fallback rates if config is unavailable
const FALLBACK_RATES = {
    inperson: {
        baseFare: 150,
        perKm: 40,
        perMin: 5,
        perStop: 100
    },
    standard: {
        baseFare: 150,
        perKm: 40,
        perMin: 5,
        perStop: 100
    },
    parcel: {
        baseFare: 200,
        perKm: 50,
        perMin: 2,
        perStop: 80
    }
};

/**
 * Calculate estimated fare with dynamic rates from config
 * @param {number} distanceMeters - Distance in meters
 * @param {number} durationSeconds - Duration in seconds
 * @param {number} stopCount - Number of intermediate stops
 * @param {string} rideType - 'inperson' or 'parcel'
 * @param {string|null} promoCode
 * @param {string|null} userId
 * @param {string|null} vehicleCategory
 * @param {object|null} parcelDetails
 */
const calculateEstimate = async (distanceMeters, durationSeconds, stopCount, rideType = 'inperson', promoCode = null, userId = null, vehicleCategory = null, parcelDetails = null, cachedConfig = null, cachedCategory = null) => {
    try {
        // Fetch dynamic config
        const config = cachedConfig || await configService.getConfig();
        const surgeMultiplier = config.surgeMultiplier || 1.0;
        console.log(config);

        let rates = {};

        // 1. Try to get rates from Vehicle Category if specified
        if (vehicleCategory) {
            try {
                if (cachedCategory) {
                    rates = {
                        baseFare: cachedCategory.baseFare,
                        perKm: cachedCategory.perKmRate,
                        perMin: cachedCategory.perMinuteRate || cachedCategory.perMinRate,
                        perStop: cachedCategory.perStopFee,
                        minFare: cachedCategory.minFare || cachedCategory.baseFare,
                        items: cachedCategory
                    };
                } else {
                    const vehicleCategoryService = require('./vehicleCategoryService');
                    const category = await vehicleCategoryService.getCategoryDetails(vehicleCategory);
                    if (category) {
                        rates = {
                            baseFare: category.baseFare,
                            perKm: category.perKmRate,
                            perMin: category.perMinuteRate || category.perMinRate,
                            perStop: category.perStopFee,
                            minFare: category.minFare || category.baseFare,
                            items: category // Keep full category for limits
                        };
                    }
                }
            } catch (err) {
                console.warn(`Failed to fetch category ${vehicleCategory}, falling back to legacy config.`);
            }
        }

        // 2. Fallback to Legacy Config / Hardcoded defaults if no category or category not found
        if (!rates.baseFare) {
            const fallbackRates = FALLBACK_RATES[rideType] || FALLBACK_RATES.inperson;
            rates = {
                baseFare: config.baseFare?.[rideType] || fallbackRates.baseFare,
                perKm: config.perKmRate?.[rideType] || fallbackRates.perKm,
                perMin: config.perMinRate?.[rideType] || fallbackRates.perMin,
                perStop: config.perStopFee || fallbackRates.perStop,
                minFare: config.minFare?.[rideType] || fallbackRates.baseFare
            };
        }

        const distanceKm = distanceMeters / 1000;
        const durationMin = durationSeconds / 60; // Kept for metadata but not in total

        const distanceFee = distanceKm * rates.perKm;

        // --- Parcel Surcharges ---
        let weightSurcharge = 0;
        let fragileFee = 0;

        if (rideType === 'parcel' && parcelDetails) {
            // Weight Logic: 5kg free, then 50 KES per kg (configurable)
            const baseWeight = config.parcelBaseWeightKg || 5;
            const perKgRate = config.parcelPerKgRate || 50;

            const weight = parseFloat(parcelDetails.weightKg) || 0;
            if (weight > baseWeight) {
                const extraKg = Math.ceil(weight - baseWeight);
                weightSurcharge = extraKg * perKgRate;
            }

            // Fragile Logic
            if (parcelDetails.fragile) {
                fragileFee = config.parcelFragileFee || 200;
            }
        }

        // --- Core Calculation ---
        // Simplified: (Distance * Rate) + Base + Parcel Surcharges
        const subtotal = rates.baseFare + distanceFee + weightSurcharge + fragileFee;
        let total = subtotal * surgeMultiplier;

        // Apply Category Min Fare Override
        if (rates.minFare && total < rates.minFare) {
            total = rates.minFare;
        }

        // Calculate Discount
        let discount = 0;
        let appliedPromo = null;

        if (promoCode) {
            try {
                const promotionService = require('./promotionService');
                const promoResult = await promotionService.validatePromotion(promoCode, userId, Math.ceil(total));
                if (promoResult.valid) {
                    discount = promoResult.discountAmount;
                    appliedPromo = promoResult;
                }
            } catch (err) {
                console.warn('Promo validation failed in estimate:', err.message);
            }
        }

        const finalFare = Math.max(0, Math.ceil(total - discount));

        return {
            estimatedFare: finalFare,
            originalFare: Math.ceil(total),
            discountAmount: discount,
            appliedPromoCode: appliedPromo ? appliedPromo.code : null,
            distanceKm: parseFloat(distanceKm.toFixed(2)),
            durationMin: Math.ceil(durationMin),
            breakdown: {
                minFare: rates.minFare,
                baseFare: rates.baseFare,
                distanceFee: Math.ceil(distanceFee),
                timeFee: 0, // Time fee simplified out of Fikishwa core formula
                weightSurcharge: weightSurcharge,
                fragileFee: fragileFee,
                surgeMultiplier: surgeMultiplier,
                subtotal: Math.ceil(subtotal),
                discount: discount,
                tax: 0, // Included for UI scaling
                vat: 0  // Included for UI scaling
            }
        };
    } catch (error) {
        console.error('❌ Error calculating estimate, using fallback rates:', error);

        // Ultrafallback
        const rates = FALLBACK_RATES[rideType] || FALLBACK_RATES.inperson;
        const distanceKm = distanceMeters / 1000;
        const total = rates.baseFare + (distanceKm * rates.perKm);

        return {
            estimatedFare: Math.ceil(total),
            originalFare: Math.ceil(total),
            breakdown: { baseFare: rates.baseFare, distanceFee: Math.ceil(distanceKm * rates.perKm) }
        };
    }
};

/**
 * Calculate final fare based on actual trip data
 */
const calculateFinalFare = async (actualDistanceMeters, actualDurationSeconds, stopCount, rideType = 'inperson', promoCode = null, userId = null, vehicleCategory = null, parcelDetails = null, cachedConfig = null, cachedCategory = null) => {
    return await calculateEstimate(actualDistanceMeters, actualDurationSeconds, stopCount, rideType, promoCode, userId, vehicleCategory, parcelDetails, cachedConfig, cachedCategory);
};

/**
 * Calculate commission from final fare
 */
const calculateCommission = async (finalFare, cachedConfig = null) => {
    try {
        const config = cachedConfig || await configService.getConfig();
        const commissionRate = config.commissionRate || 0.03;
        const taxRate = config.taxRate || 0.16;

        const commission = finalFare * (commissionRate + taxRate);
        const driverShare = finalFare - commission;

        return {
            totalCommission: Math.ceil(commission),
            commissionRate,
            taxRate,
            driverShare: Math.floor(driverShare),
            breakdown: {
                baseCommission: Math.ceil(finalFare * commissionRate),
                tax: Math.ceil(finalFare * taxRate)
            }
        };
    } catch (error) {
        console.error('❌ Error calculating commission:', error);
        // Fallback to 19% total (3% + 16%)
        const commission = finalFare * 0.19;
        return {
            totalCommission: Math.ceil(commission),
            commissionRate: 0.03,
            taxRate: 0.16,
            driverShare: Math.floor(finalFare - commission)
        };
    }
};

module.exports = {
    calculateEstimate,
    calculateFinalFare,
    calculateCommission,
    FALLBACK_RATES
};
