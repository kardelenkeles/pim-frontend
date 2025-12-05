'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { brandService, type Brand, type CreateBrandInput, type UpdateBrandInput, createBrandSchema, updateBrandSchema } from '@/services/brandService';
import { ApiError } from '@/lib/apiClient';

type ModalMode = 'add' | 'edit' | 'delete' | null;

export default function BrandsPage() {
    const queryClient = useQueryClient();
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [currentPage, setCurrentPage] = useState(0);

    // Fetch brands with TanStack Query
    const { data: brandsData, isLoading, error } = useQuery({
        queryKey: ['brands', currentPage],
        queryFn: () => brandService.getAll({ page: currentPage, size: 10 }),
    });

    // React Hook Form for Add
    const addForm = useForm<CreateBrandInput>({
        resolver: zodResolver(createBrandSchema),
        defaultValues: { name: '' },
    });

    // React Hook Form for Edit
    const editForm = useForm<UpdateBrandInput>({
        resolver: zodResolver(updateBrandSchema),
        defaultValues: { name: '' },
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data: CreateBrandInput) => brandService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brands'] });
            closeModal();
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateBrandInput }) =>
            brandService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brands'] });
            closeModal();
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: number) => brandService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brands'] });
            closeModal();
        },
    });

    const openAddModal = () => {
        setModalMode('add');
        addForm.reset({ name: '' });
    };

    const openEditModal = (brand: Brand) => {
        setModalMode('edit');
        setSelectedBrand(brand);
        editForm.reset({ name: brand.name });
    };

    const openDeleteModal = (brand: Brand) => {
        setModalMode('delete');
        setSelectedBrand(brand);
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedBrand(null);
        addForm.reset();
        editForm.reset();
    };

    const handleAddSubmit = addForm.handleSubmit((data) => {
        createMutation.mutate(data);
    });

    const handleEditSubmit = editForm.handleSubmit((data) => {
        if (selectedBrand) {
            updateMutation.mutate({ id: selectedBrand.id, data });
        }
    });

    const handleDelete = () => {
        if (selectedBrand) {
            deleteMutation.mutate(selectedBrand.id);
        }
    };

    const brands = brandsData?.data || [];
    const totalElements = brandsData?.total || 0;
    const totalPages = Math.ceil(totalElements / 10);

    const columns = [
        { key: 'name', header: 'Name' },
        { key: 'slug', header: 'Slug' },
        {
            key: 'productCount',
            header: 'Products',
            render: (brand: Brand) => brand.productCount || 0,
        },
        {
            key: 'createdAt',
            header: 'Created At',
            render: (brand: Brand) => new Date(brand.createdAt).toLocaleDateString(),
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
                        <p className="text-red-800 dark:text-red-300">
                            {error instanceof ApiError ? error.message : 'An error occurred'}
                        </p>
                    </div>
                )}

                {/* Brands Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    {isLoading ? (
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
                <form onSubmit={modalMode === 'add' ? handleAddSubmit : handleEditSubmit} className="space-y-4">
                    <div>
                        <Input
                            label="Name"
                            {...(modalMode === 'add' ? addForm.register('name') : editForm.register('name'))}
                            placeholder="Enter brand name"
                        />
                        {modalMode === 'add' && addForm.formState.errors.name && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {addForm.formState.errors.name.message}
                            </p>
                        )}
                        {modalMode === 'edit' && editForm.formState.errors.name && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {editForm.formState.errors.name.message}
                            </p>
                        )}
                    </div>

                    {(createMutation.error || updateMutation.error) && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <p className="text-sm text-red-800 dark:text-red-300">
                                {createMutation.error instanceof ApiError
                                    ? createMutation.error.message
                                    : updateMutation.error instanceof ApiError
                                        ? updateMutation.error.message
                                        : 'An error occurred'}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 justify-end pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={closeModal}
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {createMutation.isPending || updateMutation.isPending
                                ? 'Saving...'
                                : modalMode === 'add'
                                    ? 'Add Brand'
                                    : 'Save Changes'}
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

                    {deleteMutation.error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <p className="text-sm text-red-800 dark:text-red-300">
                                {deleteMutation.error instanceof ApiError
                                    ? deleteMutation.error.message
                                    : 'Failed to delete brand'}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 justify-end pt-4">
                        <Button variant="ghost" onClick={closeModal} disabled={deleteMutation.isPending}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete Brand'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
