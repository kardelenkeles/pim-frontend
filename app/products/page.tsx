'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
    productService,
    type Product,
    type CreateProductDto,
    type UpdateProductDto,
    type ProductFilter,
    createProductSchema,
    updateProductSchema,
} from '@/services/productService';
import { brandService, type Brand } from '@/services/brandService';
import { categoryService, type Category, type CategoryTree } from '@/services/categoryService';
import { ApiError } from '@/lib/apiClient';

type ModalMode = 'add' | 'edit' | 'delete' | null;

export default function ProductsPage() {
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Filter and pagination state
    const [filters, setFilters] = useState<ProductFilter>({
        keyword: '',
        categoryId: undefined,
        brandId: undefined,
        status: undefined,
        page: 0,
        size: 10,
    });
    const [searchInput, setSearchInput] = useState('');

    // TanStack Query - Products (using search endpoint with filters)
    const { data: productsData, isLoading } = useQuery({
        queryKey: ['products', filters],
        queryFn: () => productService.search(filters),
    });

    // TanStack Query - Brands
    const { data: brandsData } = useQuery({
        queryKey: ['brands', 'all'],
        queryFn: () => brandService.getAllUnpaginated(),
    });

    // TanStack Query - Categories (Tree structure)
    const { data: categoriesTreeData } = useQuery({
        queryKey: ['categories', 'tree'],
        queryFn: () => categoryService.getTree(),
    });

    const products = productsData?.content || [];
    const totalElements = productsData?.totalElements || 0;
    const totalPages = Math.ceil(totalElements / (filters.size || 10));
    const brands = brandsData?.data || [];
    const categoriesTree = categoriesTreeData?.data || [];

    // Flatten categories for filter dropdown
    const flattenCategories = (cats: CategoryTree[], level = 0): Array<Category & { level: number }> => {
        let result: Array<Category & { level: number }> = [];
        cats.forEach((cat) => {
            result.push({ ...cat, level });
            if (cat.subCategories && cat.subCategories.length > 0) {
                result = result.concat(flattenCategories(cat.subCategories, level + 1));
            }
        });
        return result;
    };

    const categories = flattenCategories(categoriesTree);

    // React Hook Form
    const createForm = useForm<CreateProductDto>({
        resolver: zodResolver(createProductSchema),
        defaultValues: {
            barcode: '',
            categoryId: 0,
            brandId: undefined,
            title: '',
            description: '',
            attributes: {},
            images: []
        }
    });

    const updateForm = useForm<UpdateProductDto>({
        resolver: zodResolver(updateProductSchema),
        defaultValues: {}
    });

    // TanStack Mutations
    const createMutation = useMutation({
        mutationFn: (data: CreateProductDto) => productService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            closeModal();
        },
        onError: (err: any) => {
            if (err instanceof ApiError) {
                setError(`Error: ${err.message}`);
            } else {
                setError('An error occurred');
            }
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateProductDto }) =>
            productService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            closeModal();
        },
        onError: (err: any) => {
            if (err instanceof ApiError) {
                setError(`Error: ${err.message}`);
            } else {
                setError('An error occurred');
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => productService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            closeModal();
        },
        onError: (err: any) => {
            if (err instanceof ApiError) {
                setError(`Error deleting product: ${err.message}`);
            } else {
                setError('Failed to delete product');
            }
        },
    });

    const handleSearch = () => {
        setFilters((prev) => ({
            ...prev,
            keyword: searchInput || undefined,
            page: 0,
        }));
    };

    const handleFilterChange = (key: keyof ProductFilter, value: any) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value || undefined,
            page: 0,
        }));
    };

    const clearFilters = () => {
        setSearchInput('');
        setFilters({
            keyword: '',
            categoryId: undefined,
            brandId: undefined,
            status: undefined,
            page: 0,
            size: 10,
        });
    };

    const openAddModal = () => {
        setModalMode('add');
        createForm.reset({
            barcode: '',
            categoryId: 0,
            brandId: undefined,
            title: '',
            description: '',
            attributes: {},
            images: []
        });
    };

    const openEditModal = (product: Product) => {
        setModalMode('edit');
        setSelectedProduct(product);
        updateForm.reset({
            barcode: product.barcode || '',
            categoryId: product.categoryId,
            brandId: product.brandId,
            title: product.title,
            description: product.description || '',
            status: product.status,
            attributes: product.attributes || {},
            images: product.images || []
        });
    };

    const openDeleteModal = (product: Product) => {
        setModalMode('delete');
        setSelectedProduct(product);
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedProduct(null);
        setError(null);
        createForm.reset();
        updateForm.reset();
    };

    const handleCreateSubmit = async (data: CreateProductDto) => {
        setError(null);
        createMutation.mutate(data);
    };

    const handleUpdateSubmit = async (data: UpdateProductDto) => {
        if (!selectedProduct) return;
        setError(null);
        updateMutation.mutate({ id: selectedProduct.id, data });
    };

    const handleDelete = async () => {
        if (!selectedProduct) return;
        setError(null);
        deleteMutation.mutate(selectedProduct.id);
    };

    const columns = [
        {
            key: 'title',
            header: 'Title',
            render: (product: Product) => (
                <Link
                    href={`/products/${product.id}`}
                    className="text-primary hover:underline font-medium"
                >
                    {product.title}
                </Link>
            ),
        },
        { key: 'barcode', header: 'Barcode' },
        { key: 'categoryName', header: 'Category' },
        { key: 'brandName', header: 'Brand' },
        {
            key: 'status',
            header: 'Status',
            render: (product: Product) => (
                <span
                    className={`px-2 py-1 text-xs rounded-full ${product.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : product.status === 'DRAFT'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                        }`}
                >
                    {product.status}
                </span>
            ),
        },
        {
            key: 'quality',
            header: 'Quality Score',
            render: (product: Product) => {
                const score = product.quality?.score || 0;
                const color = score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600';
                return (
                    <span className={`font-semibold ${color}`}>
                        {score}%
                    </span>
                );
            },
        },
        {
            key: 'createdAt',
            header: 'Created At',
            render: (product: Product) => new Date(product.createdAt).toLocaleDateString(),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (product: Product) => (
                <div className="flex gap-2">
                    <Link href={`/products/${product.id}`}>
                        <Button variant="ghost" size="sm">
                            View
                        </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(product)}>
                        Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => openDeleteModal(product)}>
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Products' }]} />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                            Manage your product inventory ({totalElements} total)
                        </p>
                    </div>
                    <Button variant="primary" onClick={openAddModal}>
                        Add Product
                    </Button>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search by Name or Barcode */}
                        <div className="lg:col-span-2">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search by name or barcode..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <Button variant="primary" onClick={handleSearch}>
                                    Search
                                </Button>
                            </div>
                        </div>

                        {/* Clear Filters */}
                        <div className="flex items-end">
                            <Button variant="ghost" onClick={clearFilters} className="w-full">
                                Clear Filters
                            </Button>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Category
                            </label>
                            <select
                                value={filters.categoryId || ''}
                                onChange={(e) => handleFilterChange('categoryId', e.target.value ? Number(e.target.value) : undefined)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">All Categories</option>
                                {categories?.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {'  '.repeat(cat.level)}
                                        {cat.level > 0 && '└─ '}
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Brand Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Brand
                            </label>
                            <select
                                value={filters.brandId || ''}
                                onChange={(e) => handleFilterChange('brandId', e.target.value ? Number(e.target.value) : undefined)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">All Brands</option>
                                {brands?.map((brand) => (
                                    <option key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-800 dark:text-red-300">{error}</p>
                    </div>
                )}

                {/* Products Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-500 dark:text-gray-400">Loading products...</p>
                        </div>
                    ) : products?.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-500 dark:text-gray-400">No products found</p>
                        </div>
                    ) : (
                        <div className="p-6">
                            <Table data={products} columns={columns} />
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Page {filters.page! + 1} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(0, prev.page! - 1) }))}
                                    disabled={filters.page === 0}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(totalPages - 1, prev.page! + 1) }))}
                                    disabled={filters.page === totalPages - 1}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={modalMode === 'add' || modalMode === 'edit'}
                onClose={closeModal}
                title={modalMode === 'add' ? 'Add New Product' : 'Edit Product'}
                size="xl"
            >
                <form onSubmit={modalMode === 'add' ? createForm.handleSubmit(handleCreateSubmit) : updateForm.handleSubmit(handleUpdateSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Title
                            </label>
                            <input
                                {...(modalMode === 'add' ? createForm.register('title') : updateForm.register('title'))}
                                placeholder="Enter product title"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                            />
                            {modalMode === 'add' && createForm.formState.errors.title && (
                                <p className="text-red-500 text-xs mt-1">{createForm.formState.errors.title.message}</p>
                            )}
                            {modalMode === 'edit' && updateForm.formState.errors.title && (
                                <p className="text-red-500 text-xs mt-1">{updateForm.formState.errors.title.message}</p>
                            )}
                        </div>

                        {/* Barcode */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Barcode *
                            </label>
                            <input
                                {...(modalMode === 'add' ? createForm.register('barcode') : updateForm.register('barcode'))}
                                placeholder="Enter barcode"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                            />
                            {modalMode === 'add' && createForm.formState.errors.barcode && (
                                <p className="text-red-500 text-xs mt-1">{createForm.formState.errors.barcode.message}</p>
                            )}
                            {modalMode === 'edit' && updateForm.formState.errors.barcode && (
                                <p className="text-red-500 text-xs mt-1">{updateForm.formState.errors.barcode.message}</p>
                            )}
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Category
                            </label>
                            <select
                                {...(modalMode === 'add' ? createForm.register('categoryId', { valueAsNumber: true }) : updateForm.register('categoryId', { valueAsNumber: true }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">Select Category</option>
                                {categories?.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            {modalMode === 'add' && createForm.formState.errors.categoryId && (
                                <p className="text-red-500 text-xs mt-1">{createForm.formState.errors.categoryId.message}</p>
                            )}
                            {modalMode === 'edit' && updateForm.formState.errors.categoryId && (
                                <p className="text-red-500 text-xs mt-1">{updateForm.formState.errors.categoryId.message}</p>
                            )}
                        </div>

                        {/* Brand */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Brand
                            </label>
                            <select
                                {...(modalMode === 'add' ? createForm.register('brandId', { setValueAs: v => v === '' ? undefined : Number(v) }) : updateForm.register('brandId', { setValueAs: v => v === '' ? undefined : Number(v) }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">No Brand</option>
                                {brands?.map((brand) => (
                                    <option key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Status
                            </label>
                            <select
                                {...(modalMode === 'add' ? createForm.register('status') : updateForm.register('status'))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                            >
                                <option value="DRAFT">Draft</option>
                                <option value="ACTIVE">Active</option>
                                <option value="ARCHIVED">Archived</option>
                            </select>
                        </div>

                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            {...(modalMode === 'add' ? createForm.register('description') : updateForm.register('description'))}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                            placeholder="Enter product description"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3 justify-end pt-4">
                        <Button type="button" variant="ghost" onClick={closeModal} disabled={createMutation.isPending || updateMutation.isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={createMutation.isPending || updateMutation.isPending}>
                            {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : modalMode === 'add' ? 'Add Product' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={modalMode === 'delete'} onClose={closeModal} title="Delete Product">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        Are you sure you want to delete <strong>{selectedProduct?.title}</strong>? This action
                        cannot be undone.
                    </p>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3 justify-end pt-4">
                        <Button variant="ghost" onClick={closeModal} disabled={deleteMutation.isPending}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete Product'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
