'use client';

import { useState, useEffect } from 'react';
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
        page: 0,
        size: 10,
    });
    const [searchInput, setSearchInput] = useState('');
    const [barcodeInput, setBarcodeInput] = useState('');
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Form data
    const [formData, setFormData] = useState<CreateProductDto | UpdateProductDto>({
        name: '',
        sku: '',
        barcode: '',
        description: '',
        shortDescription: '',
        categoryId: 0,
        brandId: undefined,
        price: 0,
        compareAtPrice: undefined,
        costPrice: undefined,
        stock: 0,
        lowStockThreshold: undefined,
        isActive: true,
        isFeatured: false,
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
            setBrands(brandsData.content);
            setCategories(categoriesData.content);
        } catch (err) {
            console.error('Error loading initial data:', err);
        }
    };

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await productService.getAll(filters);
            setProducts(response.content);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(`Error loading products: ${err.message}`);
            } else {
                setError('Failed to load products');
            }
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

    const handleBarcodeSearch = () => {
        setFilters((prev) => ({
            ...prev,
            search: barcodeInput || undefined,
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
        setBarcodeInput('');
        setFilters({
            search: '',
            categoryId: undefined,
            brandId: undefined,
            page: 0,
            size: 10,
        });
    };

    const openAddModal = () => {
        setModalMode('add');
        setFormData({
            name: '',
            sku: '',
            barcode: '',
            description: '',
            shortDescription: '',
            categoryId: 0,
            brandId: undefined,
            price: 0,
            compareAtPrice: undefined,
            costPrice: undefined,
            stock: 0,
            lowStockThreshold: undefined,
            isActive: true,
            isFeatured: false,
        });
    };

    const openEditModal = (product: Product) => {
        setModalMode('edit');
        setSelectedProduct(product);
        setFormData({
            name: product.name,
            sku: product.sku,
            barcode: product.barcode || '',
            description: product.description || '',
            shortDescription: product.shortDescription || '',
            categoryId: product.categoryId,
            brandId: product.brandId || undefined,
            price: product.price,
            compareAtPrice: product.compareAtPrice || undefined,
            costPrice: product.costPrice || undefined,
            stock: product.stock,
            lowStockThreshold: product.lowStockThreshold || undefined,
            isActive: product.isActive,
            isFeatured: product.isFeatured,
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
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? (value ? Number(value) : undefined) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            if (modalMode === 'add') {
                await productService.create(formData as CreateProductDto);
            } else if (modalMode === 'edit' && selectedProduct) {
                await productService.update(selectedProduct.id, formData as UpdateProductDto);
            }
            await loadProducts();
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
        { key: 'name', header: 'Product Name' },
        { key: 'sku', header: 'SKU' },
        { key: 'barcode', header: 'Barcode' },
        {
            key: 'price',
            header: 'Price',
            render: (product: Product) => `$${product.price.toFixed(2)}`,
        },
        { key: 'stock', header: 'Stock' },
        { key: 'categoryName', header: 'Category' },
        { key: 'brandName', header: 'Brand' },
        {
            key: 'isActive',
            header: 'Status',
            render: (product: Product) => (
                <span
                    className={`px-2 py-1 text-xs rounded-full ${product.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                        }`}
                >
                    {product.isActive ? 'Active' : 'Inactive'}
                </span>
            ),
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
                        {/* Search by Name */}
                        <div className="lg:col-span-2">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search by name..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <Button variant="primary" onClick={handleSearch}>
                                    Search
                                </Button>
                            </div>
                        </div>

                        {/* Search by Barcode */}
                        <div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Barcode..."
                                    value={barcodeInput}
                                    onChange={(e) => setBarcodeInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                                />
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
                                {categories.map((cat) => (
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
                                {brands.map((brand) => (
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
                    ) : products.length === 0 ? (
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
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Product Name"
                            name="name"
                            value={(formData as any).name}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter product name"
                        />

                        <Input
                            label="SKU"
                            name="sku"
                            value={(formData as any).sku}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter SKU"
                        />

                        <Input
                            label="Barcode"
                            name="barcode"
                            value={(formData as any).barcode}
                            onChange={handleInputChange}
                            placeholder="Enter barcode"
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Category *
                            </label>
                            <select
                                name="categoryId"
                                value={(formData as any).categoryId}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">Select Category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Brand
                            </label>
                            <select
                                name="brandId"
                                value={(formData as any).brandId || ''}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">No Brand</option>
                                {brands.map((brand) => (
                                    <option key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Input
                            label="Price"
                            name="price"
                            type="number"
                            step="0.01"
                            value={(formData as any).price}
                            onChange={handleInputChange}
                            required
                            placeholder="0.00"
                        />

                        <Input
                            label="Compare At Price"
                            name="compareAtPrice"
                            type="number"
                            step="0.01"
                            value={(formData as any).compareAtPrice || ''}
                            onChange={handleInputChange}
                            placeholder="0.00"
                        />

                        <Input
                            label="Cost Price"
                            name="costPrice"
                            type="number"
                            step="0.01"
                            value={(formData as any).costPrice || ''}
                            onChange={handleInputChange}
                            placeholder="0.00"
                        />

                        <Input
                            label="Stock"
                            name="stock"
                            type="number"
                            value={(formData as any).stock}
                            onChange={handleInputChange}
                            required
                            placeholder="0"
                        />

                        <Input
                            label="Low Stock Threshold"
                            name="lowStockThreshold"
                            type="number"
                            value={(formData as any).lowStockThreshold || ''}
                            onChange={handleInputChange}
                            placeholder="0"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Short Description
                        </label>
                        <textarea
                            name="shortDescription"
                            value={(formData as any).shortDescription}
                            onChange={handleInputChange}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                            placeholder="Enter short description"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={(formData as any).description}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                            placeholder="Enter full description"
                        />
                    </div>

                    <div className="flex gap-4">
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

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isFeatured"
                                name="isFeatured"
                                checked={(formData as any).isFeatured}
                                onChange={handleInputChange}
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <label htmlFor="isFeatured" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                Featured
                            </label>
                        </div>
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
                        Are you sure you want to delete <strong>{selectedProduct?.name}</strong>? This action
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
