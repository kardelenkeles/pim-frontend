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

export interface ApiResponse<T> {
    data: T[];
}

// Backend's actual paginated response format
interface BackendPageResponse<T> {
    data: T[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
}

class BrandService {
    private readonly endpoint = '/brands';

    /**
     * Get all brands with pagination
     */
    async getAll(params?: { page?: number; size?: number; paginated?: boolean; sortBy?: string; sortDirection?: string }): Promise<PageResponse<Brand>> {
        const backendParams: any = {
            paginated: true,
            page: params?.page,
            size: params?.size,
        };

        // Sort parametresini field,direction formatında ekle
        if (params?.sortBy && params?.sortDirection) {
            backendParams.sort = `${params.sortBy},${params.sortDirection}`;
        }

        const response = await apiClient.get<BackendPageResponse<Brand>>(this.endpoint, {
            params: backendParams
        });

        // Transform backend response to PageResponse format
        return {
            content: response.data,
            totalElements: response.total,
            totalPages: response.totalPages,
            size: response.size,
            number: response.page,
            first: response.page === 0,
            last: response.page >= response.totalPages - 1,
            empty: response.data.length === 0,
        };
    }

    /**
     * Get all brands without pagination
     */
    async getAllUnpaginated(): Promise<ApiResponse<Brand>> {
        return apiClient.get<ApiResponse<Brand>>(this.endpoint, {
            params: { paginated: false }
        });
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
     * Search brands by keyword
     */
    async search(keyword: string, params?: { page?: number; size?: number; sortBy?: string; sortDirection?: string }): Promise<PageResponse<Brand>> {
        const backendParams: any = {
            paginated: true,
            keyword,
            page: params?.page,
            size: params?.size,
        };

        // Sort parametresini field,direction formatında ekle
        if (params?.sortBy && params?.sortDirection) {
            backendParams.sort = `${params.sortBy},${params.sortDirection}`;
        }

        // Ana endpoint'i keyword parametresiyle kullan
        const response = await apiClient.get<BackendPageResponse<Brand>>(this.endpoint, {
            params: backendParams,
        });

        // Transform backend response to PageResponse format
        return {
            content: response.data,
            totalElements: response.total,
            totalPages: response.totalPages,
            size: response.size,
            number: response.page,
            first: response.page === 0,
            last: response.page >= response.totalPages - 1,
            empty: response.data.length === 0,
        };
    }
}

export const brandService = new BrandService();
