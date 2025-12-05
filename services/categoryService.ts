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

class CategoryService {
    private readonly endpoint = '/categories';

    /**
     * Get all categories with pagination
     */
    async getAll(params?: PageRequest & { paginated?: boolean }): Promise<PageResponse<Category>> {
        return apiClient.get<PageResponse<Category>>(this.endpoint, {
            params: { paginated: true, ...params }
        });
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
     */
    async delete(id: number): Promise<void> {
        return apiClient.delete<void>(`${this.endpoint}/${id}`);
    }

    /**
     * Search categories by keyword
     */
    async search(keyword: string, params?: { page?: number; size?: number }): Promise<PageResponse<Category>> {
        return apiClient.get<PageResponse<Category>>(`${this.endpoint}/search`, {
            params: { keyword, ...params },
        });
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
