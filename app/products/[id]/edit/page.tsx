'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { productService } from '@/services/productService';
import { brandService, type Brand } from '@/services/brandService';
import { categoryService, type Category, type CategoryTree } from '@/services/categoryService';
import { ApiError } from '@/lib/apiClient';

// Zod validation schema
const productSchema = z.object({
    title: z.string().min(1, 'Product title is required').max(255),
    description: z.string().optional(),
    barcode: z.string().optional(),
    categoryId: z.number().min(1, 'Category is required'),
    brandId: z.number().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    quality: z.string().optional(),
    attributes: z.record(z.string(), z.any()).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface TreeSelectProps {
    categories: CategoryTree[];
    value: number | undefined;
    onChange: (value: number) => void;
    error?: string;
}

const TreeSelect: React.FC<TreeSelectProps> = ({ categories, value, onChange, error }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [allCategories, setAllCategories] = useState<Category[]>([]);

    useEffect(() => {
        const flattenCategories = (cats: CategoryTree[]): Category[] => {
            let result: Category[] = [];
            cats.forEach((cat) => {
                result.push(cat);
                if (cat.subCategories && cat.subCategories.length > 0) {
                    result = result.concat(flattenCategories(cat.subCategories));
                }
            });
            return result;
        };
        setAllCategories(flattenCategories(categories));
    }, [categories]);

    useEffect(() => {
        if (value) {
            const found = allCategories.find((cat) => cat.id === value);
            setSelectedCategory(found || null);
        }
    }, [value, allCategories]);

    const renderTreeNode = (category: CategoryTree, level: number = 0) => (
        <div key={category.id}>
            <button
                type="button"
                onClick={() => {
                    onChange(category.id);
                    setSelectedCategory(category);
                    setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${value === category.id ? 'bg-primary/10 text-primary' : ''
                    }`}
                style={{ paddingLeft: `${level * 20 + 12}px` }}
            >
                {category.name}
            </button>
            {category.subCategories &&
                category.subCategories.map((child: CategoryTree) => renderTreeNode(child, level + 1))}
        </div>
    );

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category *
            </label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-3 py-2 border rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
            >
                {selectedCategory ? selectedCategory.name : 'Select Category'}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {categories.map((cat) => renderTreeNode(cat))}
                    </div>
                </>
            )}

            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
        </div>
    );
};

export default function ProductEditPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id === 'new' ? null : Number(params.id);
    const isEdit = productId !== null;

    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<CategoryTree[]>([]);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            title: '',
            description: '',
            barcode: '',
            categoryId: 0,
            brandId: undefined,
            status: 'DRAFT',
            quality: '',
            attributes: {},
        },
    });

    const categoryId = watch('categoryId');

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [brandsData, categoriesData] = await Promise.all([
                brandService.getAll({ size: 1000 }),
                categoryService.getTree(),
            ]);
            setBrands(brandsData.content);
            setCategories(categoriesData.data);

            if (isEdit && productId) {
                const product = await productService.getById(productId);
                setValue('title', product.title);
                setValue('description', product.description || '');
                setValue('barcode', product.barcode || '');
                setValue('categoryId', product.categoryId);
                setValue('brandId', product.brandId || undefined);
                setValue('status', product.status);
                setValue('quality', product.quality || '');
                setValue('attributes', product.attributes || {});
            }
        } catch (err) {
            if (err instanceof ApiError) {
                setError(`Error loading data: ${err.message}`);
            } else {
                setError('Failed to load data');
            }
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: ProductFormData) => {
        setSubmitting(true);
        setError(null);

        try {
            if (isEdit && productId) {
                await productService.update(productId, data);
            } else {
                await productService.create(data);
            }
            router.push('/products');
        } catch (err) {
            if (err instanceof ApiError) {
                setError(`Error: ${err.message}`);
            } else {
                setError('An error occurred while saving');
            }
            console.error('Error saving product:', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500 dark:text-gray-400">Loading...</p>
            </div>
        );
    }

    return (
        <>
            <Breadcrumb
                items={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Products', href: '/products' },
                    { label: isEdit ? 'Edit Product' : 'New Product' },
                ]}
            />

            <div className="max-w-5xl mx-auto">
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {isEdit ? 'Edit Product' : 'Create New Product'}
                    </h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                        {isEdit ? 'Update product information' : 'Add a new product to your catalog'}
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-800 dark:text-red-300">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Basic Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Product Title *
                                </label>
                                <input
                                    {...register('title')}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    placeholder="Enter product title"
                                />
                                {errors.title && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Barcode
                                </label>
                                <input
                                    {...register('barcode')}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white ${errors.barcode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    placeholder="Enter barcode"
                                />
                                {errors.barcode && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.barcode.message}</p>
                                )}
                            </div>

                            <TreeSelect
                                categories={categories}
                                value={categoryId}
                                onChange={(value) => setValue('categoryId', value)}
                                error={errors.categoryId?.message}
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Brand
                                </label>
                                <select
                                    {...register('brandId', {
                                        setValueAs: (v) => (v === '' ? undefined : Number(v)),
                                    })}
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Status
                                </label>
                                <select
                                    {...register('status')}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                                >
                                    <option value="DRAFT">Draft</option>
                                    <option value="PUBLISHED">Published</option>
                                    <option value="ARCHIVED">Archived</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Quality
                                </label>
                                <input
                                    {...register('quality')}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                                    placeholder="Enter quality information"
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Description
                            </label>
                            <textarea
                                {...register('description')}
                                rows={6}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                                placeholder="Full product description"
                            />
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-4 justify-end">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => router.push('/products')}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={submitting}>
                            {submitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
