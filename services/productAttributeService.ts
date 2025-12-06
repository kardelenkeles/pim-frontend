import { apiClient } from '@/lib/apiClient';

interface ApiResponse<T> {
    data: T[];
}

export interface ProductAttribute {
    id: number;
    productId: number;
    key: string;
    value: string;
}

export interface ProductAttributeRequest {
    productId: number;
    key: string;
    value: string;
}

export interface ProductAttributeUpdateRequest {
    key?: string;
    value?: string;
}

class ProductAttributeService {
    private readonly endpoint = '/product-attributes';

    /**
     * Create a new product attribute
     */
    async create(data: ProductAttributeRequest): Promise<ProductAttribute> {
        return apiClient.post<ProductAttribute>(this.endpoint, data);
    }

    /**
     * Update product attribute
     */
    async update(id: number, data: ProductAttributeUpdateRequest): Promise<ProductAttribute> {
        return apiClient.put<ProductAttribute>(`${this.endpoint}/${id}`, data);
    }

    /**
     * Delete product attribute
     */
    async delete(id: number): Promise<void> {
        return apiClient.delete<void>(`${this.endpoint}/${id}`);
    }

    /**
     * Get attribute by ID
     */
    async getById(id: number): Promise<ProductAttribute> {
        return apiClient.get<ProductAttribute>(`${this.endpoint}/${id}`);
    }

    /**
     * Get all attributes for a product
     */
    async getByProductId(productId: number): Promise<ProductAttribute[]> {
        const response = await apiClient.get<ApiResponse<ProductAttribute>>(`${this.endpoint}/product/${productId}`);
        return response.data;
    }

    /**
     * Get all attributes with a specific key
     */
    async getByKey(key: string): Promise<ProductAttribute[]> {
        const response = await apiClient.get<ApiResponse<ProductAttribute>>(`${this.endpoint}/key/${key}`);
        return response.data;
    }

    /**
     * Delete all attributes for a product
     */
    async deleteByProductId(productId: number): Promise<void> {
        return apiClient.delete<void>(`${this.endpoint}/product/${productId}`);
    }
}

export const productAttributeService = new ProductAttributeService();
