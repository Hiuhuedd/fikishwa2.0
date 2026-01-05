/**
 * Promotion Service
 * Handles promotion code management
 */

import api from './api';

export interface Promotion {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    expiryDate?: string;
    usageLimit?: number;
    usedCount?: number;
    isActive: boolean;
    minTripAmount?: number;
    description?: string;
}

export interface PromotionListResponse {
    success: boolean;
    promotions: Promotion[];
}

export interface PromotionActionResponse {
    success: boolean;
    message: string;
    promotion?: Promotion;
}

/**
 * Get all promotions
 */
export const getAllPromotions = async (): Promise<PromotionListResponse> => {
    const response = await api.get<PromotionListResponse>('/api/admin/promotions/all');
    return response.data;
};

/**
 * Create a new promotion
 */
export const createPromotion = async (data: Partial<Promotion>): Promise<PromotionActionResponse> => {
    const response = await api.post<PromotionActionResponse>('/api/admin/promotions/create', data);
    return response.data;
};

/**
 * Delete a promotion
 */
export const deletePromotion = async (code: string): Promise<PromotionActionResponse> => {
    const response = await api.delete<PromotionActionResponse>(`/api/admin/promotions/${code}`);
    return response.data;
};

export default {
    getAllPromotions,
    createPromotion,
    deletePromotion,
};
