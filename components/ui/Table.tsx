'use client';

import React from 'react';

interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
}

export function Table<T extends Record<string, any>>({
    data,
    columns,
    onRowClick,
}: TableProps<T>) {
    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {data.map((item, index) => (
                        <tr
                            key={index}
                            onClick={() => onRowClick?.(item)}
                            className={onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
                        >
                            {columns.map((column) => (
                                <td
                                    key={column.key}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                                >
                                    {column.render ? column.render(item) : item[column.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
