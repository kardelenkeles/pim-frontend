'use client';

import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';

export default function Home() {
  // Sample data for dashboard
  const stats = [
    { label: 'Total Products', value: '1,234', change: '+12.5%', isPositive: true },
    { label: 'Categories', value: '48', change: '+3.2%', isPositive: true },
    { label: 'Brands', value: '156', change: '-2.1%', isPositive: false },
    { label: 'Active Users', value: '89', change: '+5.8%', isPositive: true },
  ];

  const recentProducts = [
    { id: 1, name: 'Product A', category: 'Electronics', price: '$299', status: 'Active' },
    { id: 2, name: 'Product B', category: 'Clothing', price: '$49', status: 'Active' },
    { id: 3, name: 'Product C', category: 'Home', price: '$129', status: 'Draft' },
    { id: 4, name: 'Product D', category: 'Electronics', price: '$599', status: 'Active' },
  ];

  const columns = [
    { key: 'name', header: 'Product Name' },
    { key: 'category', header: 'Category' },
    { key: 'price', header: 'Price' },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${item.status === 'Active'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
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
          <Button variant="primary">
            Add Product
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
              <p
                className={`mt-2 text-sm ${stat.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
              >
                {stat.change}
              </p>
            </div>
          ))}
        </div>

        {/* Recent Products Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Products
            </h2>
          </div>
          <div className="p-6">
            <Table data={recentProducts} columns={columns} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Manage Products
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Add, edit, or remove products from your catalog
            </p>
            <Button variant="ghost" size="sm">
              View All →
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Categories
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Organize your products with categories
            </p>
            <Button variant="ghost" size="sm">
              View All →
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Reports
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              View analytics and generate reports
            </p>
            <Button variant="ghost" size="sm">
              View All →
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
