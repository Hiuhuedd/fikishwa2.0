/**
 * API Configuration
 * 
 * Base URL and endpoint configuration for the Fikishwa backend
 */

import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

// Development / Production - configured via .env file
export const API_BASE_URL = ENV_API_BASE_URL;


export const API_ENDPOINTS = {
    // Authentication
    SEND_OTP: '/api/driver/auth/send-otp',
    VERIFY_OTP: '/api/driver/auth/verify-otp',
    UPDATE_PROFILE: '/api/driver/auth/update-profile',

    // Ride Operations
    GO_ONLINE: '/api/driver/ride/status/online',
    GO_OFFLINE: '/api/driver/ride/status/offline',
    ACCEPT_RIDE: '/api/driver/ride/accept',
    START_RIDE: '/api/driver/ride/start',
    COMPLETE_RIDE: '/api/driver/ride/complete',
    RATE_CUSTOMER: '/api/driver/ride/rate-customer',
    RECENT_RIDES: '/api/driver/ride/recent',
    AVAILABLE_CATEGORIES: '/api/driver/ride/available-categories',

    // Earnings & Payouts
    DAILY_HISTORY: '/api/driver/payout/daily-history',
};

export const API_CONFIG = {
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json',
    },
};
