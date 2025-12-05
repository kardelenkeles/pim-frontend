import { apiClient } from '@/lib/apiClient';
import type { Product } from './productService';

export interface FullProductDetail extends Product {
    brand?: {
        id: number;
        name: string;
        slug: string;
    };
    category?: {
        id: number;
        name: string;
        slug: string;
        parentCategoryId?: number;
    };
}

export interface DashboardStats {
    totalProducts: number;
    activeProducts: number;
    draftProducts: number;
    archivedProducts: number;
    totalCategories: number;
    totalBrands: number;
    averageQualityScore: number;
    productsWithoutImages: number;
    productsWithoutCategory: number;
    productsWithoutBrand: number;
    recentProducts: Product[];
}

export type ExportFormat = 'CSV' | 'JSON';

class DashboardService {
    private readonly endpoint = '/dashboard';
    private readonly productsEndpoint = '/products';

    /**
     * Get full product detail with all relations
     */
    async getFullProductDetail(id: number): Promise<FullProductDetail> {
        return apiClient.get<FullProductDetail>(`${this.productsEndpoint}/${id}/full`);
    }

    /**
     * Export products to CSV or JSON
     */
    async exportProducts(format: ExportFormat = 'CSV', params?: {
        categoryId?: number;
        brandId?: number;
        status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
    }): Promise<Blob> {
        return apiClient.get<Blob>(`${this.productsEndpoint}/export`, {
            params: { format, ...params },
        });
    }

    /**
     * Get dashboard statistics
     */
    async getStats(): Promise<DashboardStats> {
        return apiClient.get<DashboardStats>(`${this.endpoint}/stats`);
    }
}

export const dashboardService = new DashboardService();
