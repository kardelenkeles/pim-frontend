'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { categoryService, type Category } from '@/services/categoryService';
import { ApiError } from '@/lib/apiClient';

type ModalMode = 'add' | 'edit' | 'delete' | null;

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Filter and pagination state
    const [filters, setFilters] = useState<ProductFilter>({
        search: '',
        categoryId: undefined,
        brandId: undefined,
        status: undefined,
        page: 0,
        size: 10,
    });
    const [searchInput, setSearchInput] = useState('');
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // React Hook Form
    const createForm = useForm<CreateProductDto>({
        resolver: zodResolver(createProductSchema),
        defaultValues: {
            barcode: '',
            categoryId: 0,
            brandId: undefined,
            title: '',
            description: '',
            quality: '',
            attributes: {},
            images: []
        }
    });

    const updateForm = useForm<UpdateProductDto>({
        resolver: zodResolver(updateProductSchema),
        defaultValues: {}
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadProducts();
    }, [filters]);

    const loadInitialData = async () => {
        try {
            const [brandsData, categoriesData] = await Promise.all([
                brandService.getAll({ size: 1000 }),
                categoryService.getAll({ size: 1000 }),
            ]);
            // Backend array veya PageResponse döndürebilir
            setBrands(Array.isArray(brandsData) ? brandsData : brandsData.content || []);
            setCategories(Array.isArray(categoriesData) ? categoriesData : categoriesData.content || []);
        } catch (err) {
            console.error('Error loading initial data:', err);
        }
    };

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await productService.getAll(filters);
            console.log('Loaded products response:', response);
            setProducts(response.data || []);
            setTotalElements(response.total || 0);
            // Backend pagination hesapla
            setTotalPages(Math.ceil((response.total || 0) / (filters.size || 10)));
        } catch (err) {
            if (err instanceof ApiError) {
                setError(`Error loading products: ${err.message}`);
            } else {
                setError('Failed to load products');
            }
            setProducts([]);
            console.error('Error loading products:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setFilters((prev) => ({
            ...prev,
            search: searchInput || undefined,
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
            search: '',
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
            quality: '',
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
            quality: product.quality || '',
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
        setSubmitting(true);
        setError(null);

        try {
            await productService.create(data);
            await loadProducts();
            closeModal();
        } catch (err) {
            if (err instanceof ApiError) {
                setError(`Error: ${err.message}`);
            } else {
                setError('An error occurred');
            }
            console.error('Error creating product:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateSubmit = async (data: UpdateProductDto) => {
        if (!selectedProduct) return;

        setSubmitting(true);
        setError(null);

        try {
            await productService.update(selectedProduct.id, data);
            await loadProducts();
            closeModal();
        } catch (err) {
            if (err instanceof ApiError) {
                setError(`Error: ${err.message}`);
            } else {
                setError('An error occurred');
            }
            console.error('Error updating product:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedProduct) return;

        setSubmitting(true);
        setError(null);

        try {
            await productService.delete(selectedProduct.id);
            await loadProducts();
            closeModal();
        } catch (err) {
            if (err instanceof ApiError) {
                setError(`Error deleting product: ${err.message}`);
            } else {
                setError('Failed to delete product');
            }
            console.error('Error deleting product:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        { key: 'title', header: 'Title' },
        { key: 'barcode', header: 'Barcode' },
        { key: 'categoryName', header: 'Category' },
        { key: 'brandName', header: 'Brand' },
        {
            key: 'status',
            header: 'Status',
            render: (product: Product) => (
                <span
                    className={`px-2 py-1 text-xs rounded-full ${product.status === 'PUBLISHED'
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
            key: 'createdAt',
            header: 'Created At',
            render: (product: Product) => new Date(product.createdAt).toLocaleDateString(),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (product: Product) => (
                <div className="flex gap-2">
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
    console.log('Rendering ProductsPage with products:', products);
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
                    {loading ? (
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

                    {/* Pagination */}s
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
                                Title *
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
                                Category *
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
                                <option value="PUBLISHED">Published</option>
                                <option value="ARCHIVED">Archived</option>
                            </select>
                        </div>

                        {/* Quality */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Quality
                            </label>
                            <input
                                {...(modalMode === 'add' ? createForm.register('quality') : updateForm.register('quality'))}
                                placeholder="Enter quality"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                            />
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
                        <Button type="button" variant="ghost" onClick={closeModal} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={submitting}>
                            {submitting ? 'Saving...' : modalMode === 'add' ? 'Add Product' : 'Save Changes'}
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
                        <Button variant="ghost" onClick={closeModal} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDelete} disabled={submitting}>
                            {submitting ? 'Deleting...' : 'Delete Product'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
