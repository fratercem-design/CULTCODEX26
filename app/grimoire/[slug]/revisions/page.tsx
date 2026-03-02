'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Revision {
  id: string;
  revisionNumber: number;
  author: {
    id: string;
    email: string;
  };
  createdAt: string;
}

interface RevisionHistory {
  entryId: string;
  entryTitle: string;
  entrySlug: string;
  revisions: Revision[];
}

export default function RevisionHistoryPage() {
  const params = useParams();
  const slug = params?.slug as string;
  
  const [history, setHistory] = useState<RevisionHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        setAccessDenied(false);
        
        const response = await fetch(`/api/grimoire/${slug}/revisions`);
        
        if (response.status === 403) {
          setAccessDenied(true);
          return;
        }
        
        if (response.status === 404) {
          setError('Grimoire entry not found');
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch revision history');
        }
        
        const data = await response.json();
        setHistory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [slug]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Access denied state
  if (accessDenied) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">
              Access Denied
            </h1>
            <p className="text-red-700 dark:text-red-300 mb-6">
              You need grimoire_access entitlement to view revision history.
            </p>
            <Link
              href="/grimoire"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Grimoire
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
              Error
            </h2>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
          <Link
            href="/grimoire"
            className="inline-block px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            ← Back to Grimoire
          </Link>
        </div>
      </div>
    );
  }

  // Content display
  if (!history) {
    return null;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/grimoire/${history.entrySlug}`}
          className="inline-block mb-6 text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Entry
        </Link>
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Revision History</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {history.entryTitle}
          </p>
        </div>

        {/* Revisions List */}
        {history.revisions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No revisions found for this entry.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.revisions.map((revision, index) => (
              <Link
                key={revision.id}
                href={`/grimoire/${history.entrySlug}/revisions/${revision.revisionNumber}`}
                className="block border rounded-lg p-6 hover:shadow-lg transition-shadow dark:border-gray-700 dark:hover:border-gray-600"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">
                      Revision {revision.revisionNumber}
                      {index === 0 && (
                        <span className="ml-3 text-sm px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded">
                          Current
                        </span>
                      )}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      By {revision.author.email}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(revision.createdAt).toLocaleDateString()} at{' '}
                    {new Date(revision.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
