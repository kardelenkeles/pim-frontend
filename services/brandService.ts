import { apiClient } from '@/lib/apiClient';
import type { PageRequest, PageResponse } from '@/types/api';

export interface Brand {
    id: number;
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    website?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBrandDto {
    name: string;
    description?: string;
    logoUrl?: string;
    website?: string;
    isActive?: boolean;
}

export interface UpdateBrandDto {
    name?: string;
    description?: string;
    logoUrl?: string;
    website?: string;
    isActive?: boolean;
}

class BrandService {
    private readonly endpoint = '/brands';

    /**
     * Get all brands with pagination
     */
    async getAll(params?: PageRequest): Promise<PageResponse<Brand>> {
        return apiClient.get<PageResponse<Brand>>(this.endpoint, { params });
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
