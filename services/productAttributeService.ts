import { apiClient } from '@/lib/apiClient';

export interface ProductAttribute {
    id?: number;
    productId: number;
    attributeKey: string;
    attributeValue: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface AddAttributeDto {
    attributeKey: string;
    attributeValue: string;
}

export interface UpdateAttributeDto {
    attributeValue: string;
}

class ProductAttributeService {
    private readonly endpoint = '/products';

    /**
     * Add attribute to product
     */
    async add(productId: number, data: AddAttributeDto): Promise<ProductAttribute> {
        return apiClient.post<ProductAttribute>(
            `${this.endpoint}/${productId}/attributes`,
            data
        );
    }

    /**
     * Update product attribute
     */
    async update(productId: number, attributeKey: string, data: UpdateAttributeDto): Promise<ProductAttribute> {
        return apiClient.put<ProductAttribute>(
            `${this.endpoint}/${productId}/attributes/${attributeKey}`,
            data
        );
    }

    /**
     * Delete product attribute
     */
    async delete(productId: number, attributeKey: string): Promise<void> {
        return apiClient.delete<void>(
            `${this.endpoint}/${productId}/attributes/${attributeKey}`
        );
    }

    /**
     * Get all attributes for a product
     */
    async getAll(productId: number): Promise<Record<string, any>> {
        return apiClient.get<Record<string, any>>(
            `${this.endpoint}/${productId}/attributes`
        );
    }
}

export const productAttributeService = new ProductAttributeService();
