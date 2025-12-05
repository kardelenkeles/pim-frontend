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

export interface CategoryTreeResponse {
    data: CategoryTree[];
    total: number;
}

class CategoryService {
    private readonly endpoint = '/categories';

    /**
     * Get all categories with pagination
     */
    async getAll(params?: PageRequest): Promise<PageResponse<Category> | Category[]> {
        return apiClient.get<PageResponse<Category> | Category[]>(this.endpoint, { params });
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
    async getTree(): Promise<CategoryTreeResponse> {
        return apiClient.get<CategoryTreeResponse>(`${this.endpoint}/tree`);
    }

    /**
     * Get root categories (no parent)
     */
    async getRoots(params?: PageRequest): Promise<PageResponse<Category>> {
        return apiClient.get<PageResponse<Category>>(`${this.endpoint}/roots`, { params });
    }

    /**
     * Get children of a category
     */
    async getChildren(id: number, params?: PageRequest): Promise<PageResponse<Category>> {
        return apiClient.get<PageResponse<Category>>(`${this.endpoint}/${id}/children`, { params });
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
     * Search categories by name
     */
    async search(query: string, params?: PageRequest): Promise<PageResponse<Category>> {
        return apiClient.get<PageResponse<Category>>(`${this.endpoint}/search`, {
            params: { q: query, ...params },
        });
    }

    /**
     * Move category to different parent
     */
    async move(id: number, newParentId: number | null): Promise<Category> {
        return apiClient.patch<Category>(`${this.endpoint}/${id}/move`, { parentId: newParentId });
    }

    /**
     * Reorder categories
     */
    async reorder(parentId: number | null, orderedIds: number[]): Promise<void> {
        return apiClient.post<void>(`${this.endpoint}/reorder`, {
            parentId,
            orderedIds,
        });
    }
}

export const categoryService = new CategoryService();
