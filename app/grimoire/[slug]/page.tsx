'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface GrimoireEntry {
  id: string;
  title: string;
  slug: string;
  currentRevision: {
    id: string;
    revisionNumber: number;
    content: string;
    author: {
      id: string;
      email: string;
    };
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function GrimoireDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  
  const [entry, setEntry] = useState<GrimoireEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchEntry = async () => {
      try {
        setLoading(true);
        setError(null);
        setAccessDenied(false);
        
        const response = await fetch(`/api/grimoire/${slug}`);
        
        if (response.status === 403) {
          setAccessDenied(true);
          return;
        }
        
        if (response.status === 404) {
          setError('Grimoire entry not found');
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch grimoire entry');
        }
        
        const data = await response.json();
        setEntry(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
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
              You need grimoire_access entitlement to view this entry.
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
  if (!entry) {
    return null;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/grimoire"
          className="inline-block mb-6 text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Grimoire
        </Link>
        
        <article>
          <header className="mb-8">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-4xl font-bold">{entry.title}</h1>
              <Link
                href={`/grimoire/${entry.slug}/revisions`}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                View History
              </Link>
            </div>
            
            {/* Metadata */}
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>
                Revision {entry.currentRevision.revisionNumber} • 
                By {entry.currentRevision.author.email}
              </p>
              <p>
                Last updated: {new Date(entry.currentRevision.createdAt).toLocaleDateString()}
              </p>
            </div>
          </header>
          
          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown>{entry.currentRevision.content}</ReactMarkdown>
          </div>
        </article>
      </div>
    </div>
  );
}
