/**
 * Payout Service
 * Handles payout and financial statistics API calls
 */

import api from './api';

export interface PayoutStatistics {
    totalOwedCommission: number;
    totalPendingPayouts: number;
    driversOwingCount: number;
    driversOwedCount: number;
}

export interface DriverOwing {
    driverId: string;
    name: string;
    phone: string;
    owedCommission: number;
    lastTripAt: string | null;
}

export interface DriverOwed {
    driverId: string;
    name: string;
    phone: string;
    pendingPayout: number;
    payoutPreference: string;
}

export interface DriversOwingResponse {
    success: boolean;
    count: number;
    totalOwed: number;
    drivers: DriverOwing[];
}

export interface DriversOwedResponse {
    success: boolean;
    count: number;
    totalPending: number;
    drivers: DriverOwed[];
}

export interface PayoutStatsResponse {
    success: boolean;
    stats: PayoutStatistics;
}

export interface RevenueStats {
    daily: any[];
    weekly: any[];
    monthly: any[];
}

export interface RevenueResponse {
    success: boolean;
    revenue: RevenueStats;
}

/**
 * Get payout statistics overview
 */
export const getPayoutStatistics = async (): Promise<PayoutStatsResponse> => {
    const response = await api.get<PayoutStatsResponse>('/api/admin/payout/statistics');
    return response.data;
};

/**
 * Get drivers who owe commission
 */
export const getDriversOwing = async (): Promise<DriversOwingResponse> => {
    const response = await api.get<DriversOwingResponse>('/api/admin/payout/drivers-owing');
    return response.data;
};

/**
 * Get drivers who are owed payouts
 */
export const getDriversOwed = async (): Promise<DriversOwedResponse> => {
    const response = await api.get<DriversOwedResponse>('/api/admin/payout/drivers-owed');
    return response.data;
};

/**
 * Get revenue statistics by date range
 */
export const getRevenueStats = async (
    startDate?: string,
    endDate?: string
): Promise<RevenueResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get<RevenueResponse>(
        `/api/admin/payout/revenue?${params.toString()}`
    );
    return response.data;
};

export default {
    getPayoutStatistics,
    getDriversOwing,
    getDriversOwed,
    getRevenueStats,
};
