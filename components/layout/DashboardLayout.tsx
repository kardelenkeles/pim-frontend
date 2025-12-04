'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <>
            <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
            <Sidebar isOpen={isSidebarOpen} />

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <main className="pt-16 lg:pl-64 min-h-screen bg-gray-50 dark:bg-gray-950">
                <div className="p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </>
    );
}
