/**
 * Customer Service
 * Handles all customer-related API calls
 */

import api from './api';

export interface Customer {
    id: string; // or uid
    uid?: string;
    name: string;
    phone: string;
    email?: string;
    profilePhotoUrl?: string; // Optional if available
    rating?: number;
    totalRides?: number;
    createdAt?: string;
    joinedAt?: string; // In case backend uses this
    status: 'active' | 'suspended';
    // Add more fields as per backend response
}

export interface CustomerListResponse {
    success: boolean;
    customers: Customer[];
    count?: number;
    // pagination support if exists
    nextPageToken?: string;
}

/**
 * Get all customers
 * Supports optional limit query param
 */
export const getAllCustomers = async (limitNum: number = 50): Promise<CustomerListResponse> => {
    const response = await api.get<CustomerListResponse>(`/api/admin/customers/all?limit=${limitNum}`);
    return response.data;
};

export default {
    getAllCustomers,
};
