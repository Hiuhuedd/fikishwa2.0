const { getFirestoreApp } = require('../firebase');
const {
    collection, doc, getDoc, getDocs, setDoc, updateDoc,
    query, where, increment, serverTimestamp
} = require('firebase/firestore');

const db = getFirestoreApp();

class PromotionService {
    constructor() {
        this.db = db;
    }

    /**
     * Create a new promotion
     */
    async createPromotion(promoData) {
        const { code, type, value, applicableTo, validFrom, validUntil, maxUses, minFare } = promoData;

        if (!code || !type || !value) {
            throw new Error('Missing required promotion fields');
        }

        const promoRef = doc(this.db, 'promotions', code.toUpperCase());
        const promoDoc = await getDoc(promoRef);

        if (promoDoc.exists()) {
            throw new Error('Promotion code already exists');
        }

        await setDoc(promoRef, {
            code: code.toUpperCase(),
            type, // 'percentage', 'fixed', 'free_ride'
            value: Number(value),
            applicableTo: applicableTo || 'all',
            validFrom: validFrom ? new Date(validFrom) : serverTimestamp(),
            validUntil: validUntil ? new Date(validUntil) : null,
            maxUses: maxUses ? Number(maxUses) : null, // null = unlimited
            minFare: minFare ? Number(minFare) : 0,
            usedCount: 0,
            createdAt: serverTimestamp(),
            active: true
        });

        return { code, ...promoData };
    }

    /**
     * Validate and calculate discount
     */
    async validatePromotion(code, userId, fareAmount) {
        const promoRef = doc(this.db, 'promotions', code.toUpperCase());
        const promoDoc = await getDoc(promoRef);

        if (!promoDoc.exists()) {
            throw new Error('Invalid promotion code');
        }

        const promo = promoDoc.data();

        // 1. Check if active
        if (!promo.active) throw new Error('Promotion is inactive');

        // 2. Check dates
        const now = new Date();
        if (promo.validUntil && now > promo.validUntil.toDate()) {
            throw new Error('Promotion has expired');
        }
        if (promo.validFrom && now < promo.validFrom.toDate()) {
            throw new Error('Promotion is not active yet');
        }

        // 3. Check usage limits (Global)
        if (promo.maxUses && promo.usedCount >= promo.maxUses) {
            throw new Error('Promotion usage limit reached');
        }

        // 4. Check user usage (if needed, implemented via 'redemptions' subcollection or array)
        if (userId) {
            const usageRef = doc(this.db, 'promotions', code.toUpperCase(), 'redemptions', userId);
            const usageDoc = await getDoc(usageRef);
            if (usageDoc.exists()) {
                throw new Error('You have already used this promotion');
            }
        }

        // 5. Check min fare
        if (fareAmount && promo.minFare && fareAmount < promo.minFare) {
            throw new Error(`Minimum fare of ${promo.minFare} required`);
        }

        // Calculate Discount
        let discountAmount = 0;
        if (promo.type === 'percentage') {
            discountAmount = fareAmount * (promo.value / 100);
        } else if (promo.type === 'fixed') {
            discountAmount = promo.value;
        } else if (promo.type === 'free_ride') {
            discountAmount = fareAmount; // 100% off
        }

        // Cap discount at total fare (no negative fares)
        if (discountAmount > fareAmount) discountAmount = fareAmount;

        return {
            valid: true,
            code: promo.code,
            type: promo.type,
            value: promo.value,
            discountAmount,
            finalFare: fareAmount - discountAmount
        };
    }

    /**
     * Mark promotion as used
     */
    async redeemPromotion(code, userId, rideId) {
        const promoRef = doc(this.db, 'promotions', code.toUpperCase());

        // Transactional update recommended for production, but simple update for now
        await updateDoc(promoRef, {
            usedCount: increment(1)
        });

        // Record user redemption
        const redemptionRef = doc(this.db, 'promotions', code.toUpperCase(), 'redemptions', userId);
        await setDoc(redemptionRef, {
            userId,
            rideId,
            redeemedAt: serverTimestamp()
        });
    }

    /**
     * Generate unique referral code (e.g., LAST6PHONE or random)
     */
    async generateReferralCode(userPhone) {
        if (!userPhone) return 'REF' + Math.floor(100000 + Math.random() * 900000);

        let p = userPhone.replace(/\D/g, '');
        const suffix = p.substring(p.length - 6);
        const code = `REF${suffix}`;

        // Ensure uniqueness (simple check, conflict resolution could be added)
        const usersRef = collection(this.db, 'customers'); // Check customers
        const q = query(usersRef, where('referralCode', '==', code));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            return `REF${Math.floor(100000 + Math.random() * 900000)}`;
        }

        return code;
    }

    /**
     * Process a referral
     */
    async processReferral(referralCode, newUserId, newUserPhone) {
        // 1. Find referrer
        const customersRef = collection(this.db, 'customers');
        const driversRef = collection(this.db, 'drivers');

        let referrer = null;
        let referrerCollection = 'customers';

        // Search customers first
        let q = query(customersRef, where('referralCode', '==', referralCode));
        let snapshot = await getDocs(q);

        if (snapshot.empty) {
            // Search drivers
            q = query(driversRef, where('referralCode', '==', referralCode));
            snapshot = await getDocs(q);
            if (!snapshot.empty) {
                referrer = { id: snapshot.docs[0].id, data: snapshot.docs[0].data() };
                referrerCollection = 'drivers';
            }
        } else {
            referrer = { id: snapshot.docs[0].id, data: snapshot.docs[0].data() };
        }

        if (!referrer) {
            throw new Error('Invalid referral code');
        }

        if (referrer.id === newUserId) {
            throw new Error('Cannot refer yourself');
        }

        // 2. Create referral record
        const referralRef = doc(collection(this.db, 'referrals'));
        await setDoc(referralRef, {
            referrerId: referrer.id,
            refereeId: newUserId,
            referredPhone: newUserPhone,
            codeUsed: referralCode,
            status: 'completed',
            referrerRewardIssued: true,
            referredRewardIssued: true,
            createdAt: serverTimestamp()
        });

        // 3. Issue rewards
        const rewardAmount = 200; // Configurable constant
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30); // 30 days validity

        // Referrer Bonus
        await this.addBonusToUser(referrer.id, referrerCollection, {
            type: 'referral',
            value: rewardAmount,
            description: `Referral Bonus for inviting user ${newUserPhone.slice(-4)}`,
            expiresAt: expiryDate
        });

        // Referee Bonus
        await this.addBonusToUser(newUserId, 'customers', {
            type: 'referral',
            value: rewardAmount,
            description: `Welcome Bonus for using code ${referralCode}`,
            expiresAt: expiryDate
        });

        // 4. Send SMS
        const smsService = require('./smsService'); // Lean import to avoid circular dependency issues at top level
        await smsService.generateReferralBonusSMS(referrer.data.name || 'User', referrer.data.phone, rewardAmount);

        return {
            valid: true,
            referrerId: referrer.id,
            bonusAmount: rewardAmount
        };
    }

    /**
     * Add bonus to a user (customer or driver)
     */
    async addBonusToUser(userId, collectionName, bonusData) {
        const userRef = doc(this.db, collectionName, userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const currentBonuses = userDoc.data().earnedBonuses || [];
            currentBonuses.push({
                ...bonusData,
                id: Math.random().toString(36).substr(2, 9),
                used: false,
                issuedAt: new Date().toISOString()
            });

            await updateDoc(userRef, {
                earnedBonuses: currentBonuses
            });
        }
    }
}

module.exports = new PromotionService();
