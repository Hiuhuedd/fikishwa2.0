/**
 * Vehicle Category Service
 * Handles vehicle category management
 */

import api from './api';

export interface VehicleCategory {
    categoryId: string; // Renamed from id to match backend
    name: string;
    image: string; // url to image
    description?: string;

    // Pricing
    baseFare: number;
    perKmRate: number;
    perMinuteRate: number;
    minimumFare: number;

    // Capacity
    maxPassengers: number;
    luggageCapacity?: number;

    // Status
    isActive: boolean;
    order?: number; // Sorting order
}

export interface CategoryListResponse {
    success: boolean;
    categories: VehicleCategory[];
}

export interface CategoryActionResponse {
    success: boolean;
    message: string;
    category?: VehicleCategory;
}

/**
 * Get all vehicle categories
 */
export const getAllCategories = async (): Promise<CategoryListResponse> => {
    const response = await api.get<CategoryListResponse>('/api/admin/vehicle-categories');
    // Ensure all categories have isActive mapped from active if needed
    const categories = response.data.categories.map((cat: any) => ({
        ...cat,
        isActive: cat.active !== undefined ? cat.active : cat.isActive,
    }));
    return { ...response.data, categories };
};

/**
 * Create a new category
 */
export const createCategory = async (data: Partial<VehicleCategory>): Promise<CategoryActionResponse> => {
    // Backend expects 'active' field
    const payload = { ...data, active: data.isActive };
    const response = await api.post<CategoryActionResponse>('/api/admin/vehicle-categories/create', payload);
    return response.data;
};

/**
 * Update an existing category
 */
export const updateCategory = async (id: string, data: Partial<VehicleCategory>): Promise<CategoryActionResponse> => {
    const payload = { ...data, active: data.isActive, categoryId: id };
    const response = await api.post<CategoryActionResponse>(`/api/admin/vehicle-categories/${id}/update`, payload);
    return response.data;
};

/**
 * Toggle category status (active/inactive)
 */
export const toggleCategory = async (id: string, isActive: boolean): Promise<CategoryActionResponse> => {
    const response = await api.post<CategoryActionResponse>(`/api/admin/vehicle-categories/${id}/toggle`, { isActive });
    return response.data;
};

export default {
    getAllCategories,
    createCategory,
    updateCategory,
    toggleCategory,
};
