import { apiClient } from '@/lib/apiClient';
import type { Quality } from './productService';

export interface QualityResult {
    hasBrand: boolean;
    hasTitle: boolean;
    hasStatus: boolean;
    imageCount: number;
    hasCategory: boolean;
    attributeCount: number;
    hasDescription: boolean;
    completenessPercentage: number;
}

export interface QualityDto {
    id: number;
    score: number;
    result: QualityResult;
    createdAt: string;
    updatedAt: string;
}

class QualityService {
    private readonly endpoint = '/quality';

    /**
     * Run quality control for a product
     */
    async runQualityControl(productId: number): Promise<Quality> {
        return apiClient.post<Quality>(`${this.endpoint}/run`, null, {
            params: { productId }
        });
    }

    /**
     * Get quality details by product ID
     */
    async getByProductId(productId: number): Promise<Quality> {
        return apiClient.get<Quality>(`${this.endpoint}/product/${productId}`);
    }

    /**
     * Update quality score manually
     */
    async update(productId: number, score: number): Promise<Quality> {
        return apiClient.put<Quality>(`${this.endpoint}/product/${productId}`, { score });
    }
}

export const qualityService = new QualityService();
