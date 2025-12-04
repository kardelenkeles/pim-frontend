import { apiClient } from '@/lib/apiClient';
import type { PageRequest, PageResponse } from '@/types/api';

export interface Product {
    id: number;
    name: string;
    slug: string;
    sku: string;
    barcode?: string;
    description?: string;
    shortDescription?: string;
    categoryId: number;
    categoryName?: string;
    brandId?: number;
    brandName?: string;
    price: number;
    compareAtPrice?: number;
    costPrice?: number;
    stock: number;
    lowStockThreshold?: number;
    weight?: number;
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
    };
    images?: string[];
    primaryImage?: string;
    isActive: boolean;
    isFeatured: boolean;
    tags?: string[];
    attributes?: Record<string, any>;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateProductDto {
    name: string;
    sku: string;
    barcode?: string;
    description?: string;
    shortDescription?: string;
    categoryId: number;
    brandId?: number;
    price: number;
    compareAtPrice?: number;
    costPrice?: number;
    stock: number;
    lowStockThreshold?: number;
    weight?: number;
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
    };
    images?: string[];
    primaryImage?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    tags?: string[];
    attributes?: Record<string, any>;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
}

export interface UpdateProductDto {
    name?: string;
    sku?: string;
    barcode?: string;
    description?: string;
    shortDescription?: string;
    categoryId?: number;
    brandId?: number;
    price?: number;
    compareAtPrice?: number;
    costPrice?: number;
    stock?: number;
    lowStockThreshold?: number;
    weight?: number;
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
    };
    images?: string[];
    primaryImage?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    tags?: string[];
    attributes?: Record<string, any>;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
}

export interface ProductFilter extends PageRequest {
    search?: string;
    categoryId?: number;
    brandId?: number;
    minPrice?: number;
    maxPrice?: number;
    isActive?: boolean;
    isFeatured?: boolean;
    inStock?: boolean;
    tags?: string[];
}

class ProductService {
    private readonly endpoint = '/products';

    /**
     * Get all products with pagination and filters
     */
    async getAll(params?: ProductFilter): Promise<PageResponse<Product>> {
        return apiClient.get<PageResponse<Product>>(this.endpoint, { params });
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
