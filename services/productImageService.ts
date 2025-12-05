import { apiClient } from '@/lib/apiClient';
import type { ProductImage } from './productService';

export interface AddImageDto {
    imageUrl: string;
    altText?: string;
    order: number;
}

export interface UpdateImageDto {
    imageUrl?: string;
    altText?: string;
    order?: number;
}

export interface ReorderImageDto {
    imageId: number;
    newOrder: number;
}

class ProductImageService {
    private readonly endpoint = '/products';

    /**
     * Add image to product
     */
    async add(productId: number, data: AddImageDto): Promise<ProductImage> {
        return apiClient.post<ProductImage>(
            `${this.endpoint}/${productId}/images`,
            data
        );
    }

    /**
     * Update product image
     */
    async update(productId: number, imageId: number, data: UpdateImageDto): Promise<ProductImage> {
        return apiClient.put<ProductImage>(
            `${this.endpoint}/${productId}/images/${imageId}`,
            data
        );
    }

    /**
     * Delete product image
     */
    async delete(productId: number, imageId: number): Promise<void> {
        return apiClient.delete<void>(
            `${this.endpoint}/${productId}/images/${imageId}`
        );
    }

    /**
     * Get all images for a product
     */
    async getAll(productId: number): Promise<ProductImage[]> {
        return apiClient.get<ProductImage[]>(
            `${this.endpoint}/${productId}/images`
        );
    }

    /**
     * Reorder product images
     */
    async reorder(productId: number, reorders: ReorderImageDto[]): Promise<void> {
        return apiClient.put<void>(
            `${this.endpoint}/${productId}/images/reorder`,
            reorders
        );
    }
}

export const productImageService = new ProductImageService();
