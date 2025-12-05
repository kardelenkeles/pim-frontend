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

  console.log('Dashboard data:', statsData);
  console.log('Dashboard error:', error);

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
          <Link href="/products">
            <Button variant="primary">
              View Products
            </Button>
          </Link>
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
