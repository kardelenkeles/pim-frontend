'use client';

import React from 'react';

interface NavbarProps {
    onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
    return (
        <nav className="fixed top-0 z-30 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 lg:pl-64">
            <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <button
                            onClick={onMenuClick}
                            className="inline-flex items-center p-2 text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <button className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </button>

                        {/* User Menu */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                                A
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};
