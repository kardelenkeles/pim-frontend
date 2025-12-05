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

// Backend'den gelen Product yapısı
export interface Product {
    id: number;
    barcode?: string;
    categoryId: number;
    categoryName?: string;
    brandId?: number;
    brandName?: string;
    title: string;
    description?: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    quality?: string | null;
    attributes?: Record<string, any>;
    images?: ProductImage[];
    createdAt: string;
    updatedAt: string;
}

// Zod Schema - Create Product
export const createProductSchema = z.object({
    barcode: z.string().min(1, 'Barcode is required'),
    categoryId: z.number().min(1, 'Category is required'),
    brandId: z.number().optional(),
    title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
    description: z.string().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    quality: z.string().optional(),
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
    categoryId: z.number().min(1, 'Category is required').optional(),
    brandId: z.number().optional(),
    title: z.string().min(1, 'Title is required').max(255, 'Title is too long').optional(),
    description: z.string().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    quality: z.string().optional(),
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

export interface ProductFilter extends PageRequest {
    search?: string;
    categoryId?: number;
    brandId?: number;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    quality?: string;
}

class ProductService {
    private readonly endpoint = '/products';

    /**
     * Get all products with pagination and filters
     */
    async getAll(params?: ProductFilter): Promise<ProductListResponse> {
        const response = await apiClient.get<ProductListResponse>(this.endpoint, params as any);
        return response;
    }

    /**
     * Get product by ID
     */
    async getById(id: number): Promise<Product> {
        return apiClient.get<Product>(`${this.endpoint}/${id}`);
    }

    /**
     * Get product by slug
     */
    async getBySlug(slug: string): Promise<Product> {
        return apiClient.get<Product>(`${this.endpoint}/slug/${slug}`);
    }

    /**
     * Get product by SKU
     */
    async getBySku(sku: string): Promise<Product> {
        return apiClient.get<Product>(`${this.endpoint}/sku/${sku}`);
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
     * Delete product
     */
    async delete(id: number): Promise<void> {
        return apiClient.delete<void>(`${this.endpoint}/${id}`);
    }

    /**
     * Search products
     */
    async search(query: string, params?: PageRequest): Promise<PageResponse<Product>> {
        return apiClient.get<PageResponse<Product>>(`${this.endpoint}/search`, {
            params: { q: query, ...params },
        });
    }

    /**
     * Get featured products
     */
    async getFeatured(params?: PageRequest): Promise<PageResponse<Product>> {
        return apiClient.get<PageResponse<Product>>(`${this.endpoint}/featured`, { params });
    }

    /**
     * Get products by category
     */
    async getByCategory(categoryId: number, params?: PageRequest): Promise<PageResponse<Product>> {
        return apiClient.get<PageResponse<Product>>(`${this.endpoint}/category/${categoryId}`, {
            params,
        });
    }

    /**
     * Get products by brand
     */
    async getByBrand(brandId: number, params?: PageRequest): Promise<PageResponse<Product>> {
        return apiClient.get<PageResponse<Product>>(`${this.endpoint}/brand/${brandId}`, { params });
    }

    /**
     * Update product stock
     */
    async updateStock(id: number, stock: number): Promise<Product> {
        return apiClient.patch<Product>(`${this.endpoint}/${id}/stock`, { stock });
    }

    /**
     * Bulk update products
     */
    async bulkUpdate(ids: number[], data: Partial<UpdateProductDto>): Promise<void> {
        return apiClient.patch<void>(`${this.endpoint}/bulk`, { ids, data });
    }

    /**
     * Bulk delete products
     */
    async bulkDelete(ids: number[]): Promise<void> {
        return apiClient.post<void>(`${this.endpoint}/bulk-delete`, { ids });
    }

    /**
     * Check if SKU exists
     */
    async skuExists(sku: string, excludeId?: number): Promise<boolean> {
        const result = await apiClient.get<{ exists: boolean }>(
            `${this.endpoint}/check-sku`,
            {
                params: { sku, excludeId },
            }
        );
        return result.exists;
    }

    /**
     * Check if barcode exists
     */
    async barcodeExists(barcode: string, excludeId?: number): Promise<boolean> {
        const result = await apiClient.get<{ exists: boolean }>(
            `${this.endpoint}/check-barcode`,
            {
                params: { barcode, excludeId },
            }
        );
        return result.exists;
    }
}

export const productService = new ProductService();
