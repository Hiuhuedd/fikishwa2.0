/**
 * Driver Service
 * Handles all driver-related API calls
 */

import api from './api';

export interface Driver {
    driverId: string; // Backend returns this
    uid?: string;
    id?: string;
    name: string;
    phone: string;
    email?: string;
    profilePhotoUrl?: string;
    status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'active' | 'disabled';
    registrationStatus?: 'pending' | 'approved' | 'rejected' | 'pending_review';
    isOnline?: boolean;
    isEnabled?: boolean;
    vehicleType?: string;
    createdAt?: string;
    submittedAt?: string; // from pending list
    joinedAt?: string; // from all list
    // Document URLs
    idFrontUrl?: string;
    idBackUrl?: string;
    licenseUrl?: string;
    psvBadgeUrl?: string;
    goodConductUrl?: string;
    carImageUrl?: string;
    carRegistrationUrl?: string;
    // Vehicle Details
    vehicle?: { // Nested object from pending list
        make: string;
        model: string;
        year: string;
    };
    carMake?: string; // Direct property from details
    carModel?: string; // Direct property from details
    carYear?: string; // Direct property from details
    vehicleRegNo?: string;
}

export interface DriverListResponse {
    success: boolean;
    count: number;
    drivers: Driver[];
}

export interface DriverDetailsResponse {
    success: boolean;
    driver: Driver;
}

export interface DriverActionResponse {
    success: boolean;
    message: string;
    data?: any;
}

/**
 * Get pending drivers
 */
export const getPendingDrivers = async (): Promise<DriverListResponse> => {
    const response = await api.get<DriverListResponse>('/api/admin/drivers/pending');
    return response.data;
};

/**
 * Get all drivers with optional filters
 */
export const getAllDrivers = async (status?: string): Promise<DriverListResponse> => {
    const url = status
        ? `/api/admin/drivers/all?registrationStatus=${status}`
        : '/api/admin/drivers/all';

    const response = await api.get<DriverListResponse>(url);
    return response.data;
};

/**
 * Get detailed driver profile
 */
export const getDriverDetails = async (driverId: string): Promise<DriverDetailsResponse> => {
    const response = await api.get<DriverDetailsResponse>(`/api/admin/drivers/${driverId}`);
    return response.data;
};

/**
 * Approve driver registration
 */
export const approveDriver = async (driverId: string, notes?: string): Promise<DriverActionResponse> => {
    const response = await api.post<DriverActionResponse>(`/api/admin/drivers/${driverId}/approve`, {
        notes,
    });
    return response.data;
};

/**
 * Reject driver registration
 */
export const rejectDriver = async (driverId: string, reason: string): Promise<DriverActionResponse> => {
    const response = await api.post<DriverActionResponse>(`/api/admin/drivers/${driverId}/reject`, {
        reason,
    });
    return response.data;
};

/**
 * Toggle driver enabled/disabled status (using auth routes based on API ref)
 * Note: Check API_REFERENCE item 10, calls /api/admin/auth/toggle-driver-status
 */
export const toggleDriverStatus = async (uid: string, isEnabled: boolean): Promise<DriverActionResponse> => {
    const response = await api.post<DriverActionResponse>('/api/admin/auth/toggle-driver-status', {
        uid,
        isEnabled,
    });
    return response.data;
};

// Also verify driver strictly (item 9 in API Ref) if needed, seems redundant with approveDriver above but let's include for completeness if paths differ
export const verifyDriverAction = async (uid: string, status: 'approved' | 'rejected'): Promise<DriverActionResponse> => {
    const response = await api.post<DriverActionResponse>('/api/admin/auth/verify-driver', {
        uid,
        status
    });
    return response.data;
};

/**
 * Update driver approved category
 */
export const updateDriverCategory = async (driverId: string, categoryId: string): Promise<DriverActionResponse> => {
    const response = await api.post<DriverActionResponse>(`/api/admin/drivers/${driverId}/update-category`, {
        categoryId,
    });
    return response.data;
};

export default {
    getPendingDrivers,
    getAllDrivers,
    getDriverDetails,
    approveDriver,
    rejectDriver,
    toggleDriverStatus,
    verifyDriverAction,
    updateDriverCategory
};
