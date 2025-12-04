'use client';

import { useState, useEffect } from 'react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
    categoryService,
    type Category,
    type CategoryTree,
    type CreateCategoryDto,
    type UpdateCategoryDto,
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
    const hasChildren = category.children && category.children.length > 0;

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
                    {!category.isActive && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            Inactive
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
                    {category.children.map((child) => (
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
    const [categories, setCategories] = useState<CategoryTree[]>([]);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [parentId, setParentId] = useState<number | null>(null);
    const [formData, setFormData] = useState<CreateCategoryDto | UpdateCategoryDto>({
        name: '',
        description: '',
        parentId: undefined,
        imageUrl: '',
        isActive: true,
        displayOrder: 0,
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            setError(null);
            const [treeData, allData] = await Promise.all([
                categoryService.getTree(),
                categoryService.getAll({ size: 1000 }),
            ]);
            setCategories(treeData);
            setAllCategories(allData.content);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(`Error loading categories: ${err.message}`);
            } else {
                setError('Failed to load categories');
            }
            console.error('Error loading categories:', err);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = (parentCategoryId: number | null = null) => {
        setModalMode('add');
        setParentId(parentCategoryId);
        setFormData({
            name: '',
            description: '',
            parentId: parentCategoryId || undefined,
            imageUrl: '',
            isActive: true,
            displayOrder: 0,
        });
    };

    const openEditModal = (category: Category) => {
        setModalMode('edit');
        setSelectedCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            parentId: category.parentId || undefined,
            imageUrl: category.imageUrl || '',
            isActive: category.isActive,
            displayOrder: category.displayOrder,
        });
    };

    const openDeleteModal = (category: Category) => {
        setModalMode('delete');
        setSelectedCategory(category);
    };

    const openMoveModal = (category: Category) => {
        setModalMode('move');
        setSelectedCategory(category);
        setParentId(category.parentId || null);
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedCategory(null);
        setParentId(null);
        setFormData({
            name: '',
            description: '',
            parentId: undefined,
            imageUrl: '',
            isActive: true,
            displayOrder: 0,
        });
        setError(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            if (modalMode === 'add') {
                await categoryService.create(formData as CreateCategoryDto);
            } else if (modalMode === 'edit' && selectedCategory) {
                await categoryService.update(selectedCategory.id, formData as UpdateCategoryDto);
            }
            await loadCategories();
            closeModal();
        } catch (err) {
            if (err instanceof ApiError) {
                setError(`Error: ${err.message}`);
            } else {
                setError('An error occurred');
            }
            console.error('Error submitting form:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedCategory) return;

        setSubmitting(true);
        setError(null);

        try {
            await categoryService.delete(selectedCategory.id);
            await loadCategories();
            closeModal();
        } catch (err) {
            if (err instanceof ApiError) {
                setError(`Error deleting category: ${err.message}`);
            } else {
                setError('Failed to delete category');
            }
            console.error('Error deleting category:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleMove = async () => {
        if (!selectedCategory) return;

        setSubmitting(true);
        setError(null);

        try {
            await categoryService.move(selectedCategory.id, parentId);
            await loadCategories();
            closeModal();
        } catch (err) {
            if (err instanceof ApiError) {
                setError(`Error moving category: ${err.message}`);
            } else {
                setError('Failed to move category');
            }
            console.error('Error moving category:', err);
        } finally {
            setSubmitting(false);
        }
    };

    // Filter out the selected category and its descendants from parent selection
    const getAvailableParents = () => {
        if (!selectedCategory) return allCategories;

        const isDescendant = (cat: Category, ancestorId: number): boolean => {
            if (cat.id === ancestorId) return true;
            if (!cat.parentId) return false;
            const parent = allCategories.find((c) => c.id === cat.parentId);
            return parent ? isDescendant(parent, ancestorId) : false;
        };

        return allCategories.filter(
            (cat) => cat.id !== selectedCategory.id && !isDescendant(cat, selectedCategory.id)
        );
    };

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
                    {loading ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-500 dark:text-gray-400">Loading categories...</p>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-500 dark:text-gray-400">No categories found</p>
                        </div>
                    ) : (
                        <div className="p-6">
                            {categories.map((category) => (
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
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Name"
                        name="name"
                        value={(formData as any).name}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter category name"
                    />

                    <Input
                        label="Description"
                        name="description"
                        value={(formData as any).description}
                        onChange={handleInputChange}
                        placeholder="Enter category description"
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Parent Category
                        </label>
                        <select
                            name="parentId"
                            value={(formData as any).parentId || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">None (Root Category)</option>
                            {getAvailableParents().map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.path}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Image URL"
                        name="imageUrl"
                        value={(formData as any).imageUrl}
                        onChange={handleInputChange}
                        placeholder="https://example.com/image.png"
                    />

                    <Input
                        label="Display Order"
                        name="displayOrder"
                        type="number"
                        value={(formData as any).displayOrder}
                        onChange={handleInputChange}
                        placeholder="0"
                    />

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isActive"
                            name="isActive"
                            checked={(formData as any).isActive}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Active
                        </label>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3 justify-end pt-4">
                        <Button type="button" variant="ghost" onClick={closeModal} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={submitting}>
                            {submitting ? 'Saving...' : modalMode === 'add' ? 'Add Category' : 'Save Changes'}
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
                                    {cat.path}
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
                        <Button variant="ghost" onClick={closeModal} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleMove} disabled={submitting}>
                            {submitting ? 'Moving...' : 'Move Category'}
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
                        <Button variant="ghost" onClick={closeModal} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDelete} disabled={submitting}>
                            {submitting ? 'Deleting...' : 'Delete Category'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
