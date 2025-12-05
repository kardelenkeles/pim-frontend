import { apiClient } from '@/lib/apiClient';
import type { PageRequest, PageResponse } from '@/types/api';
import { z } from 'zod';

// Backend'den gelen ProductImage yapısı
export interface ProductImage {
    id?: number;
    imageUrl: string;
    altText?: string;
    order: number;
}

// Backend'den gelen Quality yapısı
export interface Quality {
    id: number;
    score: number;
    result: string;
    createdAt: string;
    updatedAt: string;
}

// Backend'den gelen Product yapısı
export interface Product {
    id: number;
    barcode?: string;
    categoryId: number | null;
    categoryName?: string | null;
    brandId?: number | null;
    brandName?: string | null;
    title: string | null;
    description?: string | null;
    status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
    quality?: Quality | null;
    attributes?: Record<string, any>;
    images?: ProductImage[];
    createdAt: string;
    updatedAt: string;
}

// Zod Schema - Create Product
export const createProductSchema = z.object({
    barcode: z.string().min(1, 'Barcode is required'),
    categoryId: z.number().optional(),
    brandId: z.number().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
    attributes: z.record(z.string(), z.any()).optional(),
    images: z.array(z.object({
        imageUrl: z.string().url('Invalid image URL'),
        altText: z.string().optional(),
        order: z.number().min(0)
    })).optional()
});

// Zod Schema - Update Product
export const updateProductSchema = z.object({
    barcode: z.string().min(1, 'Barcode is required').optional(),
    categoryId: z.number().optional(),
    brandId: z.number().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
    attributes: z.record(z.string(), z.any()).optional(),
    images: z.array(z.object({
        id: z.number().optional(),
        imageUrl: z.string().url('Invalid image URL'),
        altText: z.string().optional(),
        order: z.number().min(0)
    })).optional()
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;

// Backend response yapısı
export interface ProductListResponse {
    data: Product[];
    total: number;
}

export interface ProductFilter {
    keyword?: string;
    categoryId?: number;
    brandId?: number;
    status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
    page?: number;
    size?: number;
}

class ProductService {
    private readonly endpoint = '/products';

    /**
     * Get all products with pagination
     */
    async getAll(params?: { page?: number; size?: number; paginated?: boolean }): Promise<PageResponse<Product>> {
        return apiClient.get<PageResponse<Product>>(this.endpoint, {
            params: { paginated: true, ...params }
        });
    }

    /**
     * Search products with filters
     */
    async search(params?: ProductFilter): Promise<PageResponse<Product>> {
        return apiClient.get<PageResponse<Product>>(`${this.endpoint}/search`, { params });
    }

    /**
     * Get product by ID
     */
    async getById(id: number): Promise<Product> {
        return apiClient.get<Product>(`${this.endpoint}/${id}`);
    }

    /**
     * Get product by barcode
     */
    async getByBarcode(barcode: string): Promise<Product> {
        return apiClient.get<Product>(`${this.endpoint}/barcode/${barcode}`);
    }

    /**
     * Create new product
     */
    async create(data: CreateProductDto): Promise<Product> {
        return apiClient.post<Product>(this.endpoint, data);
    }

    /**
     * Update existing product
     */
    async update(id: number, data: UpdateProductDto): Promise<Product> {
        return apiClient.put<Product>(`${this.endpoint}/${id}`, data);
    }

    /**
     * Update product status
     */
    async updateStatus(id: number, status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'): Promise<void> {
        return apiClient.patch<void>(`${this.endpoint}/${id}/status`, null, {
            params: { status }
        });
    }

    /**
     * Delete product
     */
    async delete(id: number): Promise<void> {
        return apiClient.delete<void>(`${this.endpoint}/${id}`);
    }
}

export const productService = new ProductService();
