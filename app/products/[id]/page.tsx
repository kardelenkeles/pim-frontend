'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { productService } from '@/services/productService';
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
                    { label: product.title },
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
                                                Quality
                                            </dt>
                                            <dd className="mt-1 text-base text-gray-900 dark:text-white">
                                                {product.quality}
                                            </dd>
                                        </div>
                                    )}
                                </div>
                            </dl>
                        </div>

                        {/* Attributes Card */}
                        {product.attributes && Object.keys(product.attributes).length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Attributes
                                </h2>
                                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(product.attributes).map(([key, value]) => (
                                        <div key={key}>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                                                {key.replace(/_/g, ' ')}
                                            </dt>
                                            <dd className="mt-1 text-base text-gray-900 dark:text-white">
                                                {String(value)}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        )}

                        {/* Images Card */}
                        {product.images && product.images.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Images
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {product.images.map((image, index) => (
                                        <div
                                            key={index}
                                            className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                                        >
                                            <img
                                                src={image.imageUrl}
                                                alt={image.altText || `${product.title} - Image ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                }}
                                            />
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
                </div>
            </div>
        </>
    );
}
