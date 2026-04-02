import api, { API_BASE_URL, TOKEN_KEY } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const driverApiService = {
    // Auth
    login: (payload: any) => api.post('/api/auth/driver/login', payload),
    sendOtp: (phone: string) => api.post('/api/driver/auth/send-otp', { phone }),
    verifyOtp: (payload: any) => api.post('/api/driver/auth/verify-otp', payload),
    updateProfile: (payload: any) => api.post('/api/driver/auth/update-profile', payload),
    submitRegistration: (payload: any) => api.post('/api/driver/auth/submit-registration', payload),
    uploadImage: async (formData: FormData) => {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        const response = await fetch(`${API_BASE_URL}/api/upload`, {
            method: 'POST',
            body: formData,
            headers: {
                Accept: 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Upload failed: ${response.status} ${errText}`);
        }
        const data = await response.json();
        return { data };
    },

    // Ride Lifecycle
    getActiveRide: () => api.get('/api/driver/ride/active'),
    goOnline: (location: any) => api.post('/api/driver/ride/status/online', location),
    goOffline: () => api.post('/api/driver/ride/status/offline'),
    acceptRide: (rideId: string) => api.post('/api/driver/ride/accept', { rideId }),
    updateStatus: (payload: any) => api.post('/api/driver/ride/status/update', payload),
    startRide: (rideId: string) => api.post('/api/driver/ride/start', { rideId }),
    completeRide: (payload: any) => api.post('/api/driver/ride/complete', payload),
    confirmPayment: (rideId: string) => api.post('/api/driver/ride/confirm-payment', { rideId }),
    cancelRide: (rideId: string, reason: string) => api.post('/api/driver/ride/cancel', { rideId, reason }),

    // Earnings & Payouts
    getDailyPayout: () => api.get('/api/driver/payout/daily'),
    getPayoutHistory: () => api.get('/api/driver/payout/daily-history'),
    getRecentRides: () => api.get('/api/driver/ride/recent'),
    getRideHistory: () => api.get('/api/driver/ride/history'),
    getProfile: () => api.get('/api/driver/auth/profile'),

    // Referral
    getReferralCode: () => api.get('/api/referral/referral-code'),
    getBonuses: () => api.get('/api/referral/bonuses'),
};

export default driverApiService;
