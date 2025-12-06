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
    lowQualityProducts?: number;
    highQualityProducts?: number;
}

export interface QualityStats {
    averageScore: number;
    highQualityCount: number;
    mediumQualityCount: number;
    lowQualityCount: number;
    productsWithoutQuality: number;
}

export type ExportFormat = 'csv' | 'json';

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
     * Export products to CSV
     */
    async exportProductsToCsv(): Promise<string> {
        const response = await fetch(`http://localhost:8080/api${this.endpoint}/products/export?format=csv`, {
            headers: {
                'Content-Type': 'text/csv',
            },
        });
        return response.text();
    }

    /**
     * Export products to JSON
     */
    async exportProductsToJson(): Promise<string> {
        const response = await fetch(`http://localhost:8080/api${this.endpoint}/products/export?format=json`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.text();
    }

    /**
     * Get dashboard statistics
     */
    async getStats(): Promise<DashboardStats> {
        return apiClient.get<DashboardStats>(`${this.endpoint}/stats`);
    }

    /**
     * Get quality control statistics
     */
    async getQualityStats(): Promise<QualityStats> {
        return apiClient.get<QualityStats>(`${this.endpoint}/quality-stats`);
    }
}

export const dashboardService = new DashboardService();
