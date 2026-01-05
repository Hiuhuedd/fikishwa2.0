const { getFirestoreApp } = require('../firebase');
const {
    collection, doc, getDoc, getDocs, setDoc, updateDoc,
    query, where, orderBy, serverTimestamp
} = require('firebase/firestore');

const db = getFirestoreApp();

// In-memory cache for categories to reduce DB reads during fare calc
let categoryCache = {};
let lastCacheUpdate = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class VehicleCategoryService {
    constructor() {
        this.cache = categoryCache;
    }

    /**
     * Create or Update a category
     */
    async createCategory(categoryData) {
        const { categoryId, name, baseFare, perKmRate, perMinRate, perStopFee } = categoryData;

        if (!categoryId || !name || !baseFare) {
            throw new Error('Missing required category fields');
        }

        const catRef = doc(db, 'vehicleCategories', categoryId);

        const data = {
            ...categoryData,
            minFare: categoryData.minFare || baseFare,
            maxPassengers: categoryData.maxPassengers || 4, // Default to 4 seats
            luggageCapacity: categoryData.luggageCapacity || 'Standard', // Default luggage info
            maxWeightKg: categoryData.maxWeightKg || 25, // Default max weight
            allowsFragile: categoryData.allowsFragile !== undefined ? categoryData.allowsFragile : false,
            active: categoryData.active !== undefined ? categoryData.active : true,
            sortOrder: categoryData.sortOrder !== undefined ? categoryData.sortOrder : 999,
            updatedAt: serverTimestamp()
        };

        // If new, add createdAt
        const docSnap = await getDoc(catRef);
        if (!docSnap.exists()) {
            data.createdAt = serverTimestamp();
        }

        await setDoc(catRef, data, { merge: true });

        // Invalidate cache
        this.cache = {};
        lastCacheUpdate = 0;

        return { categoryId, ...data };
    }

    /**
     * Get all categories (Admin)
     */
    async getAllCategories() {
        // Remove orderBy to ensure we fetch categories even if sortOrder is missing
        const q = query(collection(db, 'vehicleCategories'));
        const snapshot = await getDocs(q);
        const categories = [];
        snapshot.forEach(doc => categories.push(doc.data()));

        // Sort in memory
        return categories.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
    }

    /**
     * Get active categories (Customer)
     */
    async getActiveCategories() {
        const q = query(
            collection(db, 'vehicleCategories'),
            where('active', '==', true),
            orderBy('sortOrder', 'asc')
        );
        const snapshot = await getDocs(q);
        const categories = [];
        snapshot.forEach(doc => categories.push(doc.data()));
        return categories;
    }

    /**
     * Get specific category details (Cached)
     */
    async getCategoryDetails(categoryId) {
        // Check cache first
        if (this.cache[categoryId] && (Date.now() - lastCacheUpdate < CACHE_TTL)) {
            return this.cache[categoryId];
        }

        // Refresh cache if stale or empty
        if (Date.now() - lastCacheUpdate >= CACHE_TTL || !this.cache[categoryId]) {
            await this.refreshCache();
        }

        return this.cache[categoryId] || null;
    }

    /**
     * Refresh in-memory cache
     */
    async refreshCache() {
        const categories = await this.getAllCategories();
        this.cache = {};
        categories.forEach(cat => {
            this.cache[cat.categoryId] = cat;
        });
        lastCacheUpdate = Date.now();
    }

    /**
     * Toggle active status
     */
    async toggleCategory(categoryId, active) {
        const catRef = doc(db, 'vehicleCategories', categoryId);
        await updateDoc(catRef, {
            active,
            updatedAt: serverTimestamp()
        });

        // Invalidate cache
        this.cache = {};
        lastCacheUpdate = 0;
    }
}

module.exports = new VehicleCategoryService();
