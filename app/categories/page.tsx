'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
    categoryService,
    type Category,
    type CategoryTree,
    createCategorySchema,
    updateCategorySchema,
    type CreateCategoryInput,
    type UpdateCategoryInput,
} from '@/services/categoryService';
import { ApiError } from '@/lib/apiClient';

type ModalMode = 'add' | 'edit' | 'delete' | 'move' | null;

interface TreeNodeProps {
    category: CategoryTree;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
    onMove: (category: Category) => void;
    onAddChild: (parentId: number) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ category, onEdit, onDelete, onMove, onAddChild }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = category.subCategories && category.subCategories.length > 0;

    return (
        <div className="ml-4">
            <div className="flex items-center gap-2 py-2 group">
                {/* Expand/Collapse Button */}
                {hasChildren && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    >
                        <svg
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}
                {!hasChildren && <div className="w-6" />}

                {/* Category Info */}
                <div className="flex-1 flex items-center gap-3">
                    <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">({category.slug})</span>
                    {category.productCount !== undefined && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                            {category.productCount} products
                        </span>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => onAddChild(category.id)}>
                        Add Child
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
                        Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onMove(category)}>
                        Move
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => onDelete(category)}>
                        Delete
                    </Button>
                </div>
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div className="border-l-2 border-gray-200 dark:border-gray-700 ml-2">
                    {category.subCategories.map((child) => (
                        <TreeNode
                            key={child.id}
                            category={child}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onMove={onMove}
                            onAddChild={onAddChild}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function CategoriesPage() {
    const queryClient = useQueryClient();
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [parentId, setParentId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // React Hook Form setup
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors: formErrors },
    } = useForm<CreateCategoryInput | UpdateCategoryInput>({
        resolver: zodResolver(modalMode === 'edit' ? updateCategorySchema : createCategorySchema),
        defaultValues: {
            name: '',
            description: '',
            parentCategoryId: undefined,
            order: 0,
        },
    });

    // Queries
    const { data: categoriesTreeData, isLoading } = useQuery({
        queryKey: ['categories', 'tree'],
        queryFn: () => categoryService.getTree(),
    });

    const { data: allCategoriesData } = useQuery({
        queryKey: ['categories', 'all'],
        queryFn: () => categoryService.getAll({ size: 1000 }),
    });

    // Handle different response formats from backend
    const categoriesTree: CategoryTree[] = categoriesTreeData?.data || [];

    // Handle both array and PageResponse formats
    const allCategories: Category[] = Array.isArray(allCategoriesData)
        ? allCategoriesData
        : allCategoriesData?.content || [];

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: CreateCategoryInput) => categoryService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            closeModal();
        },
        onError: (err: ApiError) => {
            setError(`Error: ${err.message}`);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateCategoryInput }) =>
            categoryService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            closeModal();
        },
        onError: (err: ApiError) => {
            setError(`Error: ${err.message}`);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => categoryService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            closeModal();
        },
        onError: (err: ApiError) => {
            setError(`Error deleting category: ${err.message}`);
        },
    });

    const moveMutation = useMutation({
        mutationFn: ({ id, newParentId }: { id: number; newParentId: number | null }) =>
            categoryService.move(id, newParentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            closeModal();
        },
        onError: (err: ApiError) => {
            setError(`Error moving category: ${err.message}`);
        },
    });

    const openAddModal = (parentCategoryId: number | null = null) => {
        setModalMode('add');
        setParentId(parentCategoryId);
        setError(null);
        reset({
            name: '',
            description: '',
            parentCategoryId: parentCategoryId || undefined,
            order: 0,
        });
    };

    const openEditModal = (category: Category) => {
        setModalMode('edit');
        setSelectedCategory(category);
        setError(null);
        reset({
            name: category.name,
            description: category.description || '',
            parentCategoryId: category.parentCategoryId || undefined,
            order: category.order || 0,
        });
    };

    const openDeleteModal = (category: Category) => {
        setModalMode('delete');
        setSelectedCategory(category);
        setError(null);
    };

    const openMoveModal = (category: Category) => {
        setModalMode('move');
        setSelectedCategory(category);
        setParentId(category.parentCategoryId || null);
        setError(null);
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedCategory(null);
        setParentId(null);
        setError(null);
        reset();
    };

    const onSubmit = (data: CreateCategoryInput | UpdateCategoryInput) => {
        setError(null);
        if (modalMode === 'add') {
            createMutation.mutate(data as CreateCategoryInput);
        } else if (modalMode === 'edit' && selectedCategory) {
            updateMutation.mutate({ id: selectedCategory.id, data: data as UpdateCategoryInput });
        }
    };

    const handleDelete = () => {
        if (!selectedCategory) return;
        setError(null);
        deleteMutation.mutate(selectedCategory.id);
    };

    const handleMove = () => {
        if (!selectedCategory) return;
        setError(null);
        moveMutation.mutate({ id: selectedCategory.id, newParentId: parentId });
    };

    // Filter out the selected category and its descendants from parent selection
    const getAvailableParents = () => {
        if (!selectedCategory) return allCategories;

        const isDescendant = (cat: Category, ancestorId: number): boolean => {
            if (cat.id === ancestorId) return true;
            if (!cat.parentCategoryId) return false;
            const parent = allCategories.find((c) => c.id === cat.parentCategoryId);
            return parent ? isDescendant(parent, ancestorId) : false;
        };

        return allCategories.filter(
            (cat) => cat.id !== selectedCategory.id && !isDescendant(cat, selectedCategory.id)
        );
    };

    const isPending =
        createMutation.isPending ||
        updateMutation.isPending ||
        deleteMutation.isPending ||
        moveMutation.isPending;

    return (
        <>
            <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Categories' }]} />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Categories</h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                            Manage your product categories hierarchy
                        </p>
                    </div>
                    <Button variant="primary" onClick={() => openAddModal()}>
                        Add Root Category
                    </Button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-800 dark:text-red-300">{error}</p>
                    </div>
                )}

                {/* Categories Tree */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-500 dark:text-gray-400">Loading categories...</p>
                        </div>
                    ) : categoriesTree.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-500 dark:text-gray-400">No categories found</p>
                        </div>
                    ) : (
                        <div className="p-6">
                            {categoriesTree.map((category) => (
                                <TreeNode
                                    key={category.id}
                                    category={category}
                                    onEdit={openEditModal}
                                    onDelete={openDeleteModal}
                                    onMove={openMoveModal}
                                    onAddChild={openAddModal}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={modalMode === 'add' || modalMode === 'edit'}
                onClose={closeModal}
                title={modalMode === 'add' ? 'Add New Category' : 'Edit Category'}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Name *
                        </label>
                        <input
                            {...register('name')}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white ${formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                }`}
                            placeholder="Enter category name"
                        />
                        {formErrors.name && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <input
                            {...register('description')}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                            placeholder="Enter category description"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Parent Category
                        </label>
                        <select
                            {...register('parentCategoryId', {
                                setValueAs: (v) => (v === '' ? undefined : Number(v)),
                            })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">None (Root Category)</option>
                            {getAvailableParents().map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Order
                        </label>
                        <input
                            type="number"
                            {...register('order', { valueAsNumber: true })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                            placeholder="0"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3 justify-end pt-4">
                        <Button type="button" variant="ghost" onClick={closeModal} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={isPending}>
                            {isPending ? 'Saving...' : modalMode === 'add' ? 'Add Category' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Move Modal */}
            <Modal isOpen={modalMode === 'move'} onClose={closeModal} title="Move Category">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        Move <strong>{selectedCategory?.name}</strong> to a different parent:
                    </p>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            New Parent Category
                        </label>
                        <select
                            value={parentId || ''}
                            onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">None (Root Category)</option>
                            {getAvailableParents().map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3 justify-end pt-4">
                        <Button variant="ghost" onClick={closeModal} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleMove} disabled={isPending}>
                            {isPending ? 'Moving...' : 'Move Category'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={modalMode === 'delete'} onClose={closeModal} title="Delete Category">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        Are you sure you want to delete <strong>{selectedCategory?.name}</strong>? This action
                        cannot be undone.
                    </p>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3 justify-end pt-4">
                        <Button variant="ghost" onClick={closeModal} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDelete} disabled={isPending}>
                            {isPending ? 'Deleting...' : 'Delete Category'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
