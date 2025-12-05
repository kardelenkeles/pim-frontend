'use client';

import { useState, useEffect } from 'react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { brandService, type Brand, type CreateBrandDto, type UpdateBrandDto } from '@/services/brandService';
import { ApiError } from '@/lib/apiClient';

type ModalMode = 'add' | 'edit' | 'delete' | null;

export default function BrandsPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [formData, setFormData] = useState<CreateBrandDto | UpdateBrandDto>({
        name: '',
        description: '',
        logoUrl: '',
        website: '',
        isActive: true,
    });
    const [submitting, setSubmitting] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    useEffect(() => {
        loadBrands();
    }, [currentPage]);

    const loadBrands = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await brandService.getAll({ page: currentPage, size: 10 });
            console.log('Backend response:', response);
            // Backend direkt array döndürüyor, PageResponse değil
            if (Array.isArray(response)) {
                setBrands(response);
                setTotalPages(1);
                setTotalElements(response.length);
            } else {
                // Eğer PageResponse formatında geliyorsa
                setBrands(response.content || []);
                setTotalPages(response.totalPages || 1);
                setTotalElements(response.totalElements || 0);
            }
        } catch (err) {
            if (err instanceof ApiError) {
                setError(`Error loading brands: ${err.message}`);
            } else {
                setError('Failed to load brands');
            }
            setBrands([]);
            console.error('Error loading brands:', err);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setModalMode('add');
        setFormData({
            name: '',
            description: '',
            logoUrl: '',
            website: '',
            isActive: true,
        });
    };

    const openEditModal = (brand: Brand) => {
        setModalMode('edit');
        setSelectedBrand(brand);
        setFormData({
            name: brand.name,
            description: brand.description || '',
            logoUrl: brand.logoUrl || '',
            website: brand.website || '',
            isActive: brand.isActive,
        });
    };

    const openDeleteModal = (brand: Brand) => {
        setModalMode('delete');
        setSelectedBrand(brand);
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedBrand(null);
        setFormData({
            name: '',
            description: '',
            logoUrl: '',
            website: '',
            isActive: true,
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            if (modalMode === 'add') {
                await brandService.create(formData as CreateBrandDto);
            } else if (modalMode === 'edit' && selectedBrand) {
                await brandService.update(selectedBrand.id, formData as UpdateBrandDto);
            }
            await loadBrands();
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
        if (!selectedBrand) return;

        setSubmitting(true);
        setError(null);

        try {
            await brandService.delete(selectedBrand.id);
            await loadBrands();
            closeModal();
        } catch (err) {
            if (err instanceof ApiError) {
                setError(`Error deleting brand: ${err.message}`);
            } else {
                setError('Failed to delete brand');
            }
            console.error('Error deleting brand:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        { key: 'name', header: 'Name' },
        { key: 'slug', header: 'Slug' },
        {
            key: 'createdAt',
            header: 'Created At',
            render: (brand: Brand) => new Date(brand.createdAt).toLocaleDateString(),
        },
        {
            key: 'isActive',
            header: 'Status',
            render: (brand: Brand) => (
                <span
                    className={`px-2 py-1 text-xs rounded-full ${brand.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                        }`}
                >
                    {brand.isActive ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (brand: Brand) => (
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(brand)}>
                        Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => openDeleteModal(brand)}>
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Brands' }]} />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Brands</h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                            Manage your product brands ({totalElements} total)
                        </p>
                    </div>
                    <Button variant="primary" onClick={openAddModal}>
                        Add Brand
                    </Button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-800 dark:text-red-300">{error}</p>
                    </div>
                )}

                {/* Brands Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    {loading ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-500 dark:text-gray-400">Loading brands...</p>
                        </div>
                    ) : brands.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-500 dark:text-gray-400">No brands found</p>
                        </div>
                    ) : (
                        <div className="p-6">
                            <Table data={brands} columns={columns} />
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Page {currentPage + 1} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                                    disabled={currentPage === 0}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                                    disabled={currentPage === totalPages - 1}
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
                title={modalMode === 'add' ? 'Add New Brand' : 'Edit Brand'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Name"
                        name="name"
                        value={(formData as any).name}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter brand name"
                    />

                    <Input
                        label="Description"
                        name="description"
                        value={(formData as any).description}
                        onChange={handleInputChange}
                        placeholder="Enter brand description"
                    />

                    <Input
                        label="Logo URL"
                        name="logoUrl"
                        value={(formData as any).logoUrl}
                        onChange={handleInputChange}
                        placeholder="https://example.com/logo.png"
                    />

                    <Input
                        label="Website"
                        name="website"
                        value={(formData as any).website}
                        onChange={handleInputChange}
                        placeholder="https://example.com"
                    />

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
                            {submitting ? 'Saving...' : modalMode === 'add' ? 'Add Brand' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={modalMode === 'delete'} onClose={closeModal} title="Delete Brand">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        Are you sure you want to delete <strong>{selectedBrand?.name}</strong>? This action
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
                            {submitting ? 'Deleting...' : 'Delete Brand'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
