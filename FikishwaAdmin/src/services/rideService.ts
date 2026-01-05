import api from './api';

export interface Ride {
    rideId: string;
    customerId: string;
    driverId?: string;
    status: 'searching' | 'accepted' | 'in_progress' | 'arrived' | 'started' | 'completed' | 'cancelled' | 'cancelled_no_drivers';
    pickup: {
        lat: number;
        lng: number;
        address: string;
    };
    dropoff: {
        lat: number;
        lng: number;
        address: string;
    };
    finalFare?: number;
    estimatedFare?: number;
    createdAt?: any;
    driverDetails?: {
        name: string;
        phone: string;
    };
    customerName?: string; // If available or fetched
}

export interface RideStats {
    totalRides: number;
    activeRides: number;
    completedRides: number;
    cancelledRides: number;
}

export interface RideListResponse {
    success: boolean;
    rides: Ride[];
    lastDocId: string | null;
    hasMore: boolean;
}

export interface RideStatsResponse {
    success: boolean;
    stats: RideStats;
}

/**
 * Get system-wide ride statistics
 */
export const getRideStatistics = async (): Promise<RideStatsResponse> => {
    const response = await api.get<RideStatsResponse>('/api/admin/rides/stats');
    return response.data;
};

/**
 * Get paginated list of rides
 */
export const getAllRides = async (limit: number = 20, lastDocId?: string | null): Promise<RideListResponse> => {
    const params: any = { limit };
    if (lastDocId) {
        params.lastDocId = lastDocId;
    }
    const response = await api.get<RideListResponse>('/api/admin/rides', { params });
    return response.data;
};
