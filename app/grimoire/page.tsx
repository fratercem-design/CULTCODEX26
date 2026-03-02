'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface GrimoireEntry {
  id: string;
  title: string;
  slug: string;
  currentRevision: {
    revisionNumber: number;
    content: string;
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export default function GrimoirePage() {
  const [entries, setEntries] = useState<GrimoireEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // Fetch grimoire entries
  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      setAccessDenied(false);
      
      const params = new URLSearchParams();
      
      if (search) {
        params.append('search', search);
      }
      
      const url = `/api/grimoire${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (response.status === 403) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch grimoire entries');
      }
      
      const data = await response.json();
      setEntries(data.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch entries on mount and when search changes
  useEffect(() => {
    fetchEntries();
  }, [search]);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // Access denied view
  if (accessDenied) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">
              Access Denied
            </h1>
            <p className="text-red-700 dark:text-red-300 mb-6">
              You need grimoire_access entitlement to view the Grimoire.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Grimoire</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore the knowledge base with versioned entries
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search grimoire entries..."
            value={search}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
          />
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

        {/* Grimoire Entries */}
        {!loading && !error && (
          <>
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  No grimoire entries found. Try adjusting your search.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/grimoire/${entry.slug}`}
                    className="block border rounded-lg p-6 hover:shadow-lg transition-shadow dark:border-gray-700 dark:hover:border-gray-600"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-2xl font-semibold">{entry.title}</h2>
                      {entry.currentRevision && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Rev. {entry.currentRevision.revisionNumber}
                        </span>
                      )}
                    </div>
                    
                    {entry.currentRevision && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                        {entry.currentRevision.content}
                      </p>
                    )}
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Last updated: {new Date(entry.updatedAt).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
