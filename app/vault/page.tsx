'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  requiredEntitlement: string | null;
  tags: string[];
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function VaultPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch content items
  const fetchItems = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      
      if (search) {
        params.append('search', search);
      }
      
      if (selectedTags.length > 0) {
        params.append('tags', selectedTags.join(','));
      }
      
      const response = await fetch(`/api/vault?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      
      const data = await response.json();
      setItems(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch items on mount and when filters change
  useEffect(() => {
    fetchItems(1);
  }, [search, selectedTags]);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    fetchItems(newPage);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Vault</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore our content library
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div>
            <input
              type="text"
              placeholder="Search content..."
              value={search}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Content Items */}
        {!loading && !error && (
          <>
            {items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  No content found. Try adjusting your search.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/vault/${item.slug}`}
                    className="border rounded-lg p-6 hover:shadow-lg transition-shadow dark:border-gray-700 dark:hover:border-gray-600"
                  >
                    <div className="mb-4">
                      <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
                        {item.excerpt}
                      </p>
                    </div>
                    
                    {/* Tags */}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Entitlement Badge */}
                    {item.requiredEntitlement && (
                      <div className="mt-3 pt-3 border-t dark:border-gray-700">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          🔒 Requires: {item.requiredEntitlement}
                        </span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
