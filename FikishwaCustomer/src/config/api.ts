/**
 * Fikishwa Customer App - API Configuration
 */

import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

export const API_BASE_URL = ENV_API_BASE_URL || "https://fikishwa2-0-backend.onrender.com";

export const API_ENDPOINTS = {
    // Auth
    SEND_OTP: '/api/customer/auth/send-otp',
    VERIFY_OTP: '/api/customer/auth/verify-otp',
    GET_PROFILE: '/api/customer/auth/profile',
    UPDATE_PROFILE: '/api/customer/auth/update-profile',

    // Rides
    ESTIMATE_FARE: '/api/customer/ride/estimate',
    REQUEST_RIDE: '/api/customer/ride/request',
    CANCEL_RIDE: '/api/customer/ride/cancel',
    RIDE_HISTORY: '/api/customer/ride/history',
    RATE_DRIVER: '/api/customer/ride/rate-driver',

    // Promo
    APPLY_PROMO: '/api/customer/promo/apply',

    // Config
    VEHICLE_CATEGORIES: '/api/customer/ride/vehicle-categories',
    AVAILABLE_DRIVERS: '/api/customer/ride/available-drivers',
};
