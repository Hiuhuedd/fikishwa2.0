/**
 * Admin Authentication Service
 * Handles OTP-based admin login
 */

import api from './api';
import { jwtDecode } from 'jwt-decode';

export interface SendOtpResponse {
    success: boolean;
    message: string;
    data?: {
        sessionId: string;
    };
}

export interface AdminProfile {
    phone: string;
    name?: string;
    role?: string;
    createdAt?: any;
    lastLoginAt?: any;
}

export interface VerifyOtpResponse {
    success: boolean;
    message: string;
    data?: {
        token: string;
        profile: AdminProfile;
    };
}

/**
 * Decode JWT token to extract user info
 */
export const decodeToken = (token: string): { uid: string; phone: string; role: string } | null => {
    try {
        return jwtDecode(token);
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

/**
 * Send OTP to admin phone number
 * Only works if phone is pre-authorized in 'admins' collection
 */
export const sendOtp = async (phone: string): Promise<SendOtpResponse> => {
    const response = await api.post<SendOtpResponse>('/api/admin/auth/send-otp', {
        phone,
    });
    return response.data;
};

/**
 * Verify OTP and get JWT token
 */
export const verifyOtp = async (
    sessionId: string,
    otp: string
): Promise<VerifyOtpResponse> => {
    const response = await api.post<VerifyOtpResponse>('/api/admin/auth/verify-otp', {
        sessionId,
        otp,
    });
    return response.data;
};

export default {
    sendOtp,
    verifyOtp,
    decodeToken,
};
