'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { productService } from '@/services/productService';
import { productAttributeService } from '@/services/productAttributeService';
import { productImageService } from '@/services/productImageService';
import { ApiError } from '@/lib/apiClient';

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const productId = parseInt(params.id as string);

    // Fetch product details
    const { data: product, isLoading, error } = useQuery({
        queryKey: ['product', productId],
        queryFn: () => productService.getById(productId),
        enabled: !isNaN(productId),
    });

    // Fetch product attributes
    const { data: attributes = [], isLoading: attributesLoading } = useQuery({
        queryKey: ['product-attributes', productId],
        queryFn: () => productAttributeService.getByProductId(productId),
        enabled: !isNaN(productId),
    });

    // Fetch product images
    const { data: images = [], isLoading: imagesLoading } = useQuery({
        queryKey: ['product-images', productId],
        queryFn: async () => {
            console.log('[Detail View] Fetching images for product:', productId);
            const result = await productImageService.getByProductId(productId);
            console.log('[Detail View] Images fetched:', result);
            return result;
        },
        enabled: !isNaN(productId),
    });

    if (isLoading) {
        return (
            <>
                <Breadcrumb
                    items={[
                        { label: 'Dashboard', href: '/' },
                        { label: 'Products', href: '/products' },
                        { label: 'Loading...' },
                    ]}
                />
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-gray-500 dark:text-gray-400">Loading product details...</p>
                </div>
            </>
        );
    }

    if (error || !product) {
        return (
            <>
                <Breadcrumb
                    items={[
                        { label: 'Dashboard', href: '/' },
                        { label: 'Products', href: '/products' },
                        { label: 'Error' },
                    ]}
                />
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                    <p className="text-red-600 dark:text-red-400">
                        {error instanceof ApiError ? error.message : 'Product not found'}
                    </p>
                    <Button variant="primary" onClick={() => router.push('/products')}>
                        Back to Products
                    </Button>
                </div>
            </>
        );
    }

    const statusColors = {
        DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    };

    const statusColor = statusColors[product.status as keyof typeof statusColors] || statusColors.DRAFT;

    return (
        <>
            <Breadcrumb
                items={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Products', href: '/products' },
                    { label: product.title || 'Product' },
                ]}
            />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {product.title}
                            </h1>
                            <span className={`px-3 py-1 text-sm rounded-full ${statusColor}`}>
                                {product.status}
                            </span>
                        </div>
                        {product.barcode && (
                            <p className="text-gray-600 dark:text-gray-400">
                                Barcode: <span className="font-mono font-semibold">{product.barcode}</span>
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="primary"
                            onClick={() => router.push(`/products/${productId}/edit`)}
                        >
                            Edit Product
                        </Button>
                        <Button variant="ghost" onClick={() => router.push('/products')}>
                            Back
                        </Button>
                    </div>
                </div>

                {/* Product Information */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                Basic Information
                            </h2>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Title
                                    </dt>
                                    <dd className="mt-1 text-base text-gray-900 dark:text-white">
                                        {product.title}
                                    </dd>
                                </div>

                                {product.description && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Description
                                        </dt>
                                        <dd className="mt-1 text-base text-gray-900 dark:text-white whitespace-pre-wrap">
                                            {product.description}
                                        </dd>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Barcode
                                        </dt>
                                        <dd className="mt-1 text-base text-gray-900 dark:text-white font-mono">
                                            {product.barcode || '-'}
                                        </dd>
                                    </div>

                                    {product.quality && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Quality Score
                                            </dt>
                                            <dd className="mt-1 text-base text-gray-900 dark:text-white">
                                                <span className={`font-semibold ${product.quality.score >= 80 ? 'text-green-600' :
                                                    product.quality.score >= 50 ? 'text-yellow-600' :
                                                        'text-red-600'
                                                    }`}>
                                                    {product.quality.score}%
                                                </span>
                                            </dd>
                                        </div>
                                    )}
                                </div>
                            </dl>
                        </div>

                        {/* Attributes Card */}
                        {Array.isArray(attributes) && attributes.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Product Attributes
                                </h2>
                                <div className="space-y-3">
                                    {attributes.map((attr) => (
                                        <div
                                            key={attr.id}
                                            className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                                        >
                                            <div className="flex-1">
                                                <dt className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {attr.key}
                                                </dt>
                                                <dd className="mt-1 text-base text-gray-900 dark:text-white">
                                                    {attr.value}
                                                </dd>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Category & Brand Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                Classification
                            </h2>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Category
                                    </dt>
                                    <dd className="mt-1 text-base text-gray-900 dark:text-white">
                                        {product.categoryName || '-'}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Brand
                                    </dt>
                                    <dd className="mt-1 text-base text-gray-900 dark:text-white">
                                        {product.brandName || '-'}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Status Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                Status
                            </h2>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Current Status
                                    </dt>
                                    <dd className="mt-2">
                                        <span className={`px-3 py-1 text-sm rounded-full ${statusColor}`}>
                                            {product.status}
                                        </span>
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Metadata Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                Metadata
                            </h2>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Product ID
                                    </dt>
                                    <dd className="mt-1 text-base text-gray-900 dark:text-white font-mono">
                                        #{product.id}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Created At
                                    </dt>
                                    <dd className="mt-1 text-base text-gray-900 dark:text-white">
                                        {new Date(product.createdAt).toLocaleString()}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Updated At
                                    </dt>
                                    <dd className="mt-1 text-base text-gray-900 dark:text-white">
                                        {new Date(product.updatedAt).toLocaleString()}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* Product Images */}
                    {!imagesLoading && Array.isArray(images) && images.length > 0 && (
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Product Images ({images.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...images].sort((a, b) => a.order - b.order).map((image) => {
                                    console.log('[Detail View] Rendering image:', image);
                                    return (
                                        <div
                                            key={image.id}
                                            className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden group"
                                        >
                                            {/* Order Badge */}
                                            <div className="absolute top-2 left-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10">
                                                {image.order}
                                            </div>

                                            {/* Image */}
                                            <img
                                                src={image.imageUrl}
                                                alt={image.altText || `Product image ${image.order}`}
                                                className="w-full h-64 object-cover"
                                                onLoad={() => console.log('[Detail View] Image loaded successfully:', image.imageUrl)}
                                                onError={(e) => {
                                                    console.error('[Detail View] Image failed to load:', image.imageUrl);
                                                    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                                                }}
                                            />

                                            {/* Alt Text Overlay */}
                                            {image.altText && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-white text-sm line-clamp-2">
                                                        {image.altText}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
