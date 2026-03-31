import api from './api';
import { API_ENDPOINTS } from '../config/api';

export const customerApiService = {
    // Auth
    sendOtp: (phone: string) => api.post(API_ENDPOINTS.SEND_OTP, { phone }),
    verifyOtp: (payload: any) => api.post(API_ENDPOINTS.VERIFY_OTP, payload),

    // Ride
    getAvailableDrivers: () => api.get(API_ENDPOINTS.AVAILABLE_DRIVERS),
    estimateFare: (payload: any) => api.post(API_ENDPOINTS.ESTIMATE_FARE, payload),
    getRideEstimates: (payload: any) => api.post(API_ENDPOINTS.ESTIMATE_FARE, payload),
    getActiveRide: () => api.get('/api/customer/ride/active'),
    requestRide: (payload: any) => api.post(API_ENDPOINTS.REQUEST_RIDE, payload),
    cancelRide: (rideId: string, reason?: string) => api.post(API_ENDPOINTS.CANCEL_RIDE, { rideId, reason }),
    rateDriver: (payload: any) => api.post(API_ENDPOINTS.RATE_DRIVER, payload),
    getHistory: () => api.get(API_ENDPOINTS.RIDE_HISTORY),
    updateProfile: (payload: any) => api.post(API_ENDPOINTS.UPDATE_PROFILE, payload),
};

export default customerApiService;
