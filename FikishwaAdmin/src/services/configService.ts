/**
 * Configuration Service
 * Handles system-wide configuration
 */

import api from './api';

export interface AppConfig {
    commissionRate: number; // Percentage (e.g., 15 for 15%)
    maxOwedCommission: number; // Amount (e.g., 1000)
    supportPhone?: string;
    supportEmail?: string;
    termsUrl?: string;
    privacyUrl?: string;
    currency?: string; // Default: KES
    [key: string]: any; // Allow other config keys
}

export interface ConfigResponse {
    success: boolean;
    config: AppConfig;
}

export interface UpdateConfigResponse {
    success: boolean;
    message: string;
    config: AppConfig;
}

/**
 * Get current system configuration
 */
export const getConfig = async (): Promise<ConfigResponse> => {
    const response = await api.get<ConfigResponse>('/api/admin/config');
    return response.data;
};

/**
 * Update system configuration
 */
export const updateConfig = async (data: Partial<AppConfig>): Promise<UpdateConfigResponse> => {
    const response = await api.post<UpdateConfigResponse>('/api/admin/config/update', data);
    return response.data;
};

export default {
    getConfig,
    updateConfig,
};
