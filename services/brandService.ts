import { apiClient } from '@/lib/apiClient';
import type { PageRequest, PageResponse } from '@/types/api';
import { z } from 'zod';

export interface Brand {
    id: number;
    name: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
    productCount?: number;
}

export interface CreateBrandDto {
    name: string;
}

export interface UpdateBrandDto {
    name?: string;
}

// Zod Schema - Create Brand
export const createBrandSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
});

// Zod Schema - Update Brand
export const updateBrandSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name is too long').optional(),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;

export interface BrandListResponse {
    data: Brand[];
    total: number;
}

class BrandService {
    private readonly endpoint = '/brands';

    /**
     * Get all brands with pagination
     */
    async getAll(params?: PageRequest): Promise<BrandListResponse> {
        return apiClient.get<BrandListResponse>(this.endpoint, { params });
    }

    /**
     * Get brand by ID
     */
    async getById(id: number): Promise<Brand> {
        return apiClient.get<Brand>(`${this.endpoint}/${id}`);
    }

    /**
     * Get brand by slug
     */
    async getBySlug(slug: string): Promise<Brand> {
        return apiClient.get<Brand>(`${this.endpoint}/slug/${slug}`);
    }

    /**
     * Create new brand
     */
    async create(data: CreateBrandDto): Promise<Brand> {
        return apiClient.post<Brand>(this.endpoint, data);
    }

    /**
     * Update existing brand
     */
    async update(id: number, data: UpdateBrandDto): Promise<Brand> {
        return apiClient.put<Brand>(`${this.endpoint}/${id}`, data);
    }

    /**
     * Delete brand
     */
    async delete(id: number): Promise<void> {
        return apiClient.delete<void>(`${this.endpoint}/${id}`);
    }

    /**
     * Search brands by name
     */
    async search(query: string, params?: PageRequest): Promise<PageResponse<Brand>> {
        return apiClient.get<PageResponse<Brand>>(`${this.endpoint}/search`, {
            params: { q: query, ...params },
        });
    }
}

export const brandService = new BrandService();
