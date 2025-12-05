import { apiClient } from '@/lib/apiClient';
import type { PageRequest, PageResponse } from '@/types/api';
import { z } from 'zod';

export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    parentCategoryId?: number;
    order?: number;
    createdAt: string;
    updatedAt: string;
    productCount?: number;
}

export interface CreateCategoryDto {
    name: string;
    description?: string;
    parentCategoryId?: number;
    order?: number;
}

export interface UpdateCategoryDto {
    name?: string;
    description?: string;
    parentCategoryId?: number;
    order?: number;
}

// Zod Schema - Create Category
export const createCategorySchema = z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
    description: z.string().optional(),
    parentCategoryId: z.number().optional(),
    order: z.number().optional(),
});

// Zod Schema - Update Category
export const updateCategorySchema = z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name is too long').optional(),
    description: z.string().optional(),
    parentCategoryId: z.number().optional(),
    order: z.number().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export interface CategoryTree extends Category {
    subCategories: CategoryTree[];
}

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

class CategoryService {
    private readonly endpoint = '/categories';

    /**
     * Get all categories with pagination
     */
    async getAll(params?: PageRequest & { paginated?: boolean; sortBy?: string; sortDirection?: string }): Promise<PageResponse<Category>> {
        const backendParams: any = {
            paginated: true,
            page: params?.page,
            size: params?.size,
        };

        // Sort parametresini field,direction formatında ekle
        if (params?.sortBy && params?.sortDirection) {
            backendParams.sort = `${params.sortBy},${params.sortDirection}`;
        }

        const response = await apiClient.get<BackendPageResponse<Category>>(this.endpoint, {
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
     * Get all categories without pagination
     */
    async getAllUnpaginated(): Promise<ApiResponse<Category>> {
        return apiClient.get<ApiResponse<Category>>(this.endpoint, {
            params: { paginated: false }
        });
    }

    /**
     * Get category by ID
     */
    async getById(id: number): Promise<Category> {
        return apiClient.get<Category>(`${this.endpoint}/${id}`);
    }

    /**
     * Get category by slug
     */
    async getBySlug(slug: string): Promise<Category> {
        return apiClient.get<Category>(`${this.endpoint}/slug/${slug}`);
    }

    /**
     * Get category tree
     */
    async getTree(): Promise<ApiResponse<CategoryTree>> {
        return apiClient.get<ApiResponse<CategoryTree>>(`${this.endpoint}/tree`);
    }

    /**
     * Get root categories (no parent)
     */
    async getRoots(): Promise<ApiResponse<Category>> {
        return apiClient.get<ApiResponse<Category>>(`${this.endpoint}/root`);
    }

    /**
     * Get children of a category
     */
    async getChildren(id: number): Promise<ApiResponse<Category>> {
        return apiClient.get<ApiResponse<Category>>(`${this.endpoint}/${id}/subcategories`);
    }

    /**
     * Create new category
     */
    async create(data: CreateCategoryDto): Promise<Category> {
        return apiClient.post<Category>(this.endpoint, data);
    }

    /**
     * Update existing category
     */
    async update(id: number, data: UpdateCategoryDto): Promise<Category> {
        return apiClient.put<Category>(`${this.endpoint}/${id}`, data);
    }

    /**
     * Delete category
     * @param id Category ID to delete
     * @param action 'cascade' to delete all subcategories, 'reassign' to move them up one level
     */
    async delete(id: number, action: 'cascade' | 'reassign' = 'cascade'): Promise<void> {
        return apiClient.delete<void>(`${this.endpoint}/${id}`, {
            params: { action }
        });
    }

    /**
     * Search categories by keyword
     */
    async search(keyword: string, params?: { page?: number; size?: number; sortBy?: string; sortDirection?: string }): Promise<PageResponse<Category>> {
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

        // Ana endpoint'i keyword parametresiyle kullan (backend /search endpoint'i çalışmıyor)
        const response = await apiClient.get<BackendPageResponse<Category>>(this.endpoint, {
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

    /**
     * Move category to different parent
     */
    async move(id: number, newParentId: number | null): Promise<void> {
        return apiClient.patch<void>(`${this.endpoint}/${id}/move`, null, {
            params: { parentId: newParentId }
        });
    }

    /**
     * Reorder category
     */
    async reorder(id: number, order: number): Promise<void> {
        return apiClient.patch<void>(`${this.endpoint}/${id}/reorder`, null, {
            params: { order }
        });
    }
}

export const categoryService = new CategoryService();
