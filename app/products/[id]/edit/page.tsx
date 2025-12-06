'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { productService } from '@/services/productService';
import { brandService, type Brand } from '@/services/brandService';
import { categoryService, type Category, type CategoryTree } from '@/services/categoryService';
import { productAttributeService, type ProductAttribute } from '@/services/productAttributeService';
import { productImageService, type ProductImage } from '@/services/productImageService';
import { ApiError } from '@/lib/apiClient';

// Zod validation schema for create
const createProductSchema = z.object({
    title: z.string().min(1, 'Product title is required').max(255),
    description: z.string().optional(),
    barcode: z.string().min(1, 'Barcode is required'),
    categoryId: z.number().min(1, 'Category is required'),
    brandId: z.number().optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
});

// Zod validation schema for update (all fields optional)
const updateProductSchema = z.object({
    title: z.string().max(255).optional().or(z.literal('')),
    description: z.string().optional(),
    barcode: z.string().optional().or(z.literal('')),
    categoryId: z.number().optional().or(z.literal(0)),
    brandId: z.number().optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
});

type CreateProductFormData = z.infer<typeof createProductSchema>;
type UpdateProductFormData = z.infer<typeof updateProductSchema>;
type ProductFormData = CreateProductFormData | UpdateProductFormData;

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
                Category
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
    const queryClient = useQueryClient();

    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<CategoryTree[]>([]);

    // Attribute management state
    const [newAttributeKey, setNewAttributeKey] = useState('');
    const [newAttributeValue, setNewAttributeValue] = useState('');
    const [editingAttribute, setEditingAttribute] = useState<ProductAttribute | null>(null);
    const [editKey, setEditKey] = useState('');
    const [editValue, setEditValue] = useState('');

    // Image management state
    const [newImageUrl, setNewImageUrl] = useState('');
    const [newImageAltText, setNewImageAltText] = useState('');
    const [editingImage, setEditingImage] = useState<number | null>(null);
    const [editImageUrl, setEditImageUrl] = useState('');
    const [editImageAltText, setEditImageAltText] = useState('');
    const [draggedImageId, setDraggedImageId] = useState<number | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CreateProductFormData>({
        resolver: zodResolver(isEdit ? updateProductSchema : createProductSchema) as any,
        defaultValues: {
            title: '',
            description: '',
            barcode: '',
            categoryId: 0,
            brandId: undefined,
            status: 'DRAFT',
        },
    });

    const categoryId = watch('categoryId');

    // Fetch attributes for existing product
    const { data: attributes = [] } = useQuery({
        queryKey: ['product-attributes', productId],
        queryFn: () => productAttributeService.getByProductId(productId!),
        enabled: isEdit && productId !== null,
    });

    // Fetch images for existing product
    const { data: images = [] } = useQuery({
        queryKey: ['product-images', productId],
        queryFn: async () => {
            console.log('Fetching images for product:', productId);
            const result = await productImageService.getByProductId(productId!);
            console.log('Images fetched:', result);
            return result;
        },
        enabled: isEdit && productId !== null,
    });

    // Create attribute mutation
    const createAttributeMutation = useMutation({
        mutationFn: (data: { productId: number; key: string; value: string }) =>
            productAttributeService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-attributes', productId] });
            setNewAttributeKey('');
            setNewAttributeValue('');
            setError(null);
        },
        onError: (err: ApiError) => {
            setError(`Error creating attribute: ${err.message}`);
        },
    });

    // Update attribute mutation
    const updateAttributeMutation = useMutation({
        mutationFn: (data: { id: number; key?: string; value?: string }) =>
            productAttributeService.update(data.id, { key: data.key, value: data.value }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-attributes', productId] });
            setEditingAttribute(null);
            setEditKey('');
            setEditValue('');
            setError(null);
        },
        onError: (err: ApiError) => {
            setError(`Error updating attribute: ${err.message}`);
        },
    });

    // Delete attribute mutation
    const deleteAttributeMutation = useMutation({
        mutationFn: (id: number) => productAttributeService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-attributes', productId] });
            setError(null);
        },
        onError: (err: ApiError) => {
            setError(`Error deleting attribute: ${err.message}`);
        },
    });

    // Image mutations
    const addImageMutation = useMutation({
        mutationFn: (data: { productId: number; imageUrl: string; altText?: string; order: number }) =>
            productImageService.addImage(data),
        onSuccess: (result) => {
            console.log('Image added successfully:', result);
            queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
            setNewImageUrl('');
            setNewImageAltText('');
            setError(null);
        },
        onError: (err: ApiError) => {
            console.error('Error adding image:', err);
            setError(`Error adding image: ${err.message}`);
        },
    });

    const updateImageMutation = useMutation({
        mutationFn: (data: { id: number; imageUrl?: string; altText?: string }) =>
            productImageService.updateImage(data.id, { imageUrl: data.imageUrl, altText: data.altText }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
            setEditingImage(null);
            setEditImageUrl('');
            setEditImageAltText('');
            setError(null);
        },
        onError: (err: ApiError) => {
            setError(`Error updating image: ${err.message}`);
        },
    });

    const deleteImageMutation = useMutation({
        mutationFn: (id: number) => productImageService.deleteImage(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
            setError(null);
        },
        onError: (err: ApiError) => {
            setError(`Error deleting image: ${err.message}`);
        },
    });

    const reorderImagesMutation = useMutation({
        mutationFn: (data: { productId: number; imageOrders: Record<number, number> }) =>
            productImageService.reorderImages(data.productId, data.imageOrders),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
            setError(null);
        },
        onError: (err: ApiError) => {
            setError(`Error reordering images: ${err.message}`);
        },
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [brandsData, categoriesData] = await Promise.all([
                brandService.getAllUnpaginated(),
                categoryService.getTree(),
            ]);
            setBrands(brandsData.data);
            setCategories(categoriesData.data);

            if (isEdit && productId) {
                const product = await productService.getById(productId);
                setValue('title', product.title || '');
                setValue('description', product.description || '');
                setValue('barcode', product.barcode || '');
                setValue('categoryId', product.categoryId || 0);
                setValue('brandId', product.brandId || undefined);
                setValue('status', product.status);
            }
        } catch (err) {
            if (err instanceof ApiError) {
                setError(`Error loading data: ${err.message}`);
            } else {
                setError('Failed to load data');
            }
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: CreateProductFormData) => {
        setSubmitting(true);
        setError(null);

        try {
            if (isEdit && productId) {
                await productService.update(productId, data as any);
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
        } finally {
            setSubmitting(false);
        }
    };

    // Attribute handlers
    const handleAddAttribute = () => {
        if (!productId) {
            setError('Product must be created before adding attributes');
            return;
        }
        if (!newAttributeKey.trim() || !newAttributeValue.trim()) {
            setError('Both key and value are required');
            return;
        }
        createAttributeMutation.mutate({
            productId,
            key: newAttributeKey.trim(),
            value: newAttributeValue.trim(),
        });
    };

    const handleEditAttribute = (attr: ProductAttribute) => {
        setEditingAttribute(attr);
        setEditKey(attr.key);
        setEditValue(attr.value);
    };

    const handleUpdateAttribute = () => {
        if (!editingAttribute) return;
        if (!editKey.trim() || !editValue.trim()) {
            setError('Both key and value are required');
            return;
        }
        updateAttributeMutation.mutate({
            id: editingAttribute.id,
            key: editKey.trim(),
            value: editValue.trim(),
        });
    };

    const handleCancelEdit = () => {
        setEditingAttribute(null);
        setEditKey('');
        setEditValue('');
    };

    const handleDeleteAttribute = (id: number) => {
        if (confirm('Are you sure you want to delete this attribute?')) {
            deleteAttributeMutation.mutate(id);
        }
    };

    // Image handlers
    const handleAddImage = () => {
        if (!newImageUrl.trim() || !productId) {
            console.log('Image add validation failed', { newImageUrl, productId });
            return;
        }

        const currentImages = images || [];
        const maxOrder = currentImages.length > 0
            ? Math.max(...currentImages.map((img: ProductImage) => img.order))
            : 0;

        console.log('Adding image:', {
            productId,
            imageUrl: newImageUrl.trim(),
            altText: newImageAltText.trim() || undefined,
            order: maxOrder + 1,
        });

        addImageMutation.mutate({
            productId: productId,
            imageUrl: newImageUrl.trim(),
            altText: newImageAltText.trim() || undefined,
            order: maxOrder + 1,
        });
    }; const handleEditImage = (image: ProductImage) => {
        setEditingImage(image.id);
        setEditImageUrl(image.imageUrl);
        setEditImageAltText(image.altText || '');
    };

    const handleUpdateImage = () => {
        if (!editingImage || !editImageUrl.trim()) return;

        updateImageMutation.mutate({
            id: editingImage,
            imageUrl: editImageUrl.trim(),
            altText: editImageAltText.trim() || undefined,
        });
    };

    const handleCancelEditImage = () => {
        setEditingImage(null);
        setEditImageUrl('');
        setEditImageAltText('');
    };

    const handleDeleteImage = (id: number) => {
        if (confirm('Are you sure you want to delete this image?')) {
            deleteImageMutation.mutate(id);
        }
    };

    const handleDragStart = (e: React.DragEvent, imageId: number) => {
        setDraggedImageId(imageId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetImageId: number) => {
        e.preventDefault();

        if (!draggedImageId || draggedImageId === targetImageId || !productId) return;

        const currentImages = images || [];
        const draggedImage = currentImages.find((img: ProductImage) => img.id === draggedImageId);
        const targetImage = currentImages.find((img: ProductImage) => img.id === targetImageId);

        if (!draggedImage || !targetImage) return;

        const imageOrders: Record<number, number> = {
            [draggedImageId]: targetImage.order,
            [targetImageId]: draggedImage.order,
        };

        reorderImagesMutation.mutate({
            productId: productId,
            imageOrders,
        });

        setDraggedImageId(null);
    }; if (loading) {
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

                    {/* Attributes Section - Only for edit mode */}
                    {isEdit && productId && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                Product Attributes
                            </h2>

                            {/* Add New Attribute */}
                            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Add New Attribute
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <input
                                        type="text"
                                        value={newAttributeKey}
                                        onChange={(e) => setNewAttributeKey(e.target.value)}
                                        placeholder="Attribute Key (e.g., color, size)"
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                                    />
                                    <input
                                        type="text"
                                        value={newAttributeValue}
                                        onChange={(e) => setNewAttributeValue(e.target.value)}
                                        placeholder="Attribute Value (e.g., red, XL)"
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                                    />
                                    <Button
                                        type="button"
                                        variant="primary"
                                        onClick={handleAddAttribute}
                                        disabled={createAttributeMutation.isPending}
                                    >
                                        {createAttributeMutation.isPending ? 'Adding...' : 'Add Attribute'}
                                    </Button>
                                </div>
                            </div>

                            {/* Attributes List */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Current Attributes ({Array.isArray(attributes) ? attributes.length : 0})
                                </h3>
                                {!Array.isArray(attributes) || attributes.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        No attributes added yet. Add your first attribute above.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {attributes.map((attr) => (
                                            <div
                                                key={attr.id}
                                                className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                                            >
                                                {editingAttribute?.id === attr.id ? (
                                                    // Edit Mode
                                                    <>
                                                        <input
                                                            type="text"
                                                            value={editKey}
                                                            onChange={(e) => setEditKey(e.target.value)}
                                                            className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={handleUpdateAttribute}
                                                            disabled={updateAttributeMutation.isPending}
                                                        >
                                                            Save
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={handleCancelEdit}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </>
                                                ) : (
                                                    // View Mode
                                                    <>
                                                        <div className="flex-1">
                                                            <span className="font-medium text-gray-900 dark:text-white">
                                                                {attr.key}:
                                                            </span>
                                                            <span className="ml-2 text-gray-600 dark:text-gray-400">
                                                                {attr.value}
                                                            </span>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditAttribute(attr)}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteAttribute(attr.id)}
                                                            disabled={deleteAttributeMutation.isPending}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Product Images */}
                    {isEdit && productId && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Product Images
                            </h2>

                            {/* Add New Image */}
                            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Add New Image
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <input
                                        type="text"
                                        value={newImageUrl}
                                        onChange={(e) => setNewImageUrl(e.target.value)}
                                        placeholder="Image URL"
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                                    />
                                    <input
                                        type="text"
                                        value={newImageAltText}
                                        onChange={(e) => setNewImageAltText(e.target.value)}
                                        placeholder="Alt Text (optional, for SEO)"
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                                    />
                                    <Button
                                        type="button"
                                        variant="primary"
                                        onClick={handleAddImage}
                                        disabled={addImageMutation.isPending}
                                    >
                                        {addImageMutation.isPending ? 'Adding...' : 'Add Image'}
                                    </Button>
                                </div>
                            </div>

                            {/* Images List */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Current Images ({images?.length || 0})
                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                        (Drag & drop to reorder)
                                    </span>
                                </h3>
                                {!images || images.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        No images added yet. Add your first image above.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {[...images].sort((a, b) => a.order - b.order).map((image) => (
                                            <div
                                                key={image.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, image.id)}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, image.id)}
                                                className={`relative border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all ${draggedImageId === image.id
                                                    ? 'opacity-50'
                                                    : 'hover:shadow-md cursor-move'
                                                    }`}
                                            >
                                                {/* Order Badge */}
                                                <div className="absolute top-2 left-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                                    {image.order}
                                                </div>

                                                {/* Image Preview */}
                                                <div className="mb-3">
                                                    <img
                                                        src={image.imageUrl}
                                                        alt={image.altText || 'Product image'}
                                                        className="w-full h-40 object-cover rounded"
                                                        onError={(e) => {
                                                            e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                                                        }}
                                                    />
                                                </div>

                                                {editingImage === image.id ? (
                                                    // Edit Mode
                                                    <div className="space-y-2">
                                                        <input
                                                            type="text"
                                                            value={editImageUrl}
                                                            onChange={(e) => setEditImageUrl(e.target.value)}
                                                            placeholder="Image URL"
                                                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-800 dark:text-white"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={editImageAltText}
                                                            onChange={(e) => setEditImageAltText(e.target.value)}
                                                            placeholder="Alt Text"
                                                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-800 dark:text-white"
                                                        />
                                                        <div className="flex gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="primary"
                                                                size="sm"
                                                                onClick={handleUpdateImage}
                                                                disabled={updateImageMutation.isPending}
                                                            >
                                                                Save
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={handleCancelEditImage}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // View Mode
                                                    <div className="space-y-2">
                                                        {image.altText && (
                                                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                                                <span className="font-medium">Alt:</span> {image.altText}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                                                            {image.imageUrl}
                                                        </p>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEditImage(image)}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="danger"
                                                                size="sm"
                                                                onClick={() => handleDeleteImage(image.id)}
                                                                disabled={deleteImageMutation.isPending}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
