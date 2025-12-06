import { apiClient } from '@/lib/apiClient';

interface ApiResponse<T> {
    data: T[];
}

export interface ProductImage {
    id: number;
    productId: number;
    imageUrl: string;
    altText?: string;
    order: number;
}

export interface ProductImageCreateRequest {
    productId: number;
    imageUrl: string;
    altText?: string;
    order: number;
}

export interface ProductImageUpdateRequest {
    imageUrl?: string;
    altText?: string;
    order?: number;
}

class ProductImageService {
    private readonly endpoint = '/product-images';

    /**
     * Add a new product image
     */
    async addImage(data: ProductImageCreateRequest): Promise<ProductImage> {
        return apiClient.post<ProductImage>(this.endpoint, data);
    }

    /**
     * Update product image
     */
    async updateImage(id: number, data: ProductImageUpdateRequest): Promise<ProductImage> {
        return apiClient.put<ProductImage>(`${this.endpoint}/${id}`, data);
    }

    /**
     * Get image by ID
     */
    async getById(id: number): Promise<ProductImage> {
        return apiClient.get<ProductImage>(`${this.endpoint}/${id}`);
    }

    /**
     * Get all images for a product
     */
    async getByProductId(productId: number): Promise<ProductImage[]> {
        const response = await apiClient.get<ApiResponse<ProductImage>>(`${this.endpoint}/product/${productId}`);
        return response.data;
    }

    /**
     * Reorder images
     */
    async reorderImages(productId: number, imageOrders: Record<number, number>): Promise<void> {
        return apiClient.patch<void>(`${this.endpoint}/product/${productId}/reorder`, imageOrders);
    }

    /**
     * Delete product image
     */
    async deleteImage(id: number): Promise<void> {
        return apiClient.delete<void>(`${this.endpoint}/${id}`);
    }
}

export const productImageService = new ProductImageService();
