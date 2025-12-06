'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { dashboardService } from '@/services/dashboardService';
import type { Product } from '@/services/productService';

export default function Home() {
  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading, error } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardService.getStats(),
  });

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const content = format === 'csv'
        ? await dashboardService.exportProductsToCsv()
        : await dashboardService.exportProductsToJson();

      const blob = new Blob([content], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const stats = statsData ? [
    { label: 'Total Products', value: statsData.totalProducts.toString() },
    { label: 'Active Products', value: statsData.activeProducts.toString() },
    { label: 'Categories', value: statsData.totalCategories.toString() },
    { label: 'Brands', value: statsData.totalBrands.toString() },
    { label: 'Avg Quality Score', value: `${statsData.averageQualityScore.toFixed(1)}%` },
  ] : [];

  const recentProducts = statsData?.recentProducts || [];

  const columns = [
    {
      key: 'title',
      header: 'Product Name',
      render: (item: Product) => (
        <Link
          href={`/products/${item.id}`}
          className="text-primary hover:underline font-medium"
        >
          {item.title}
        </Link>
      ),
    },
    { key: 'categoryName', header: 'Category' },
    { key: 'brandName', header: 'Brand' },
    {
      key: 'status',
      header: 'Status',
      render: (item: Product) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${item.status === 'ACTIVE'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            : item.status === 'DRAFT'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
            }`}
        >
          {item.status}
        </span>
      ),
    },
  ];

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard' }]} />

      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Welcome to your PIM admin panel
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => handleExport('csv')}>
              Export CSV
            </Button>
            <Button variant="ghost" onClick={() => handleExport('json')}>
              Export JSON
            </Button>
            <Link href="/products">
              <Button variant="primary">
                View Products
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        {statsLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Loading stats...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Quality Control */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quality Control
            </h2>
          </div>
          {statsLoading ? (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400">Loading quality stats...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {statsData?.highQualityProducts || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  High Quality (80%+)
                </div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {(statsData?.totalProducts || 0) - (statsData?.highQualityProducts || 0) - (statsData?.lowQualityProducts || 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Medium Quality (50-79%)
                </div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {statsData?.lowQualityProducts || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Low Quality (&lt;50%)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Products Without Images
              </h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {statsData?.productsWithoutImages || 0}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Products missing product images
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Without Category
              </h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {statsData?.productsWithoutCategory || 0}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Products not assigned to a category
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Without Brand
              </h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {statsData?.productsWithoutBrand || 0}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Products without brand assignment
            </p>
          </div>
        </div>

        {/* Recent Products Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Products
            </h2>
          </div>
          {statsLoading ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">Loading products...</p>
            </div>
          ) : recentProducts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No products found</p>
            </div>
          ) : (
            <div className="p-6">
              <Table data={recentProducts} columns={columns} />
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/products" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Manage Products
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Add, edit, or remove products from your catalog
            </p>
            <span className="text-primary text-sm font-medium">View All →</span>
          </Link>

          <Link href="/categories" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Categories
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Organize your products with categories
            </p>
            <span className="text-primary text-sm font-medium">View All →</span>
          </Link>

          <Link href="/brands" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Brands
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Manage your product brands and suppliers
            </p>
            <span className="text-primary text-sm font-medium">View All →</span>
          </Link>
        </div>
      </div>
    </>
  );
}
