'use client';

import React from 'react';
import Link from 'next/link';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
    return (
        <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={index} className="inline-flex items-center">
                            {index > 0 && (
                                <svg
                                    className="w-3 h-3 text-gray-400 mx-1"
                                    fill="none"
                                    viewBox="0 0 6 10"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 9l4-4-4-4" />
                                </svg>
                            )}

                            {isLast || !item.href ? (
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {item.label}
                                </span>
                            ) : (
                                <Link
                                    href={item.href}
                                    className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                                >
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};
