'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface RevisionData {
  entryId: string;
  entryTitle: string;
  entrySlug: string;
  revision: {
    id: string;
    revisionNumber: number;
    content: string;
    author: {
      id: string;
      email: string;
    };
    createdAt: string;
  };
}

export default function SpecificRevisionPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const revisionNumber = params?.revisionNumber as string;
  
  const [revisionData, setRevisionData] = useState<RevisionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!slug || !revisionNumber) return;

    const fetchRevision = async () => {
      try {
        setLoading(true);
        setError(null);
        setAccessDenied(false);
        
        const response = await fetch(`/api/grimoire/${slug}/revisions/${revisionNumber}`);
        
        if (response.status === 403) {
          setAccessDenied(true);
          return;
        }
        
        if (response.status === 404) {
          setError('Revision not found');
          return;
        }
        
        if (response.status === 400) {
          setError('Invalid revision number');
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch revision');
        }
        
        const data = await response.json();
        setRevisionData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRevision();
  }, [slug, revisionNumber]);

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
              You need grimoire_access entitlement to view this revision.
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
  if (!revisionData) {
    return null;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-4 mb-6">
          <Link
            href={`/grimoire/${revisionData.entrySlug}/revisions`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to History
          </Link>
          <Link
            href={`/grimoire/${revisionData.entrySlug}`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Current Version
          </Link>
        </div>
        
        {/* Historical Revision Notice */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            📜 You are viewing a historical revision. This may not reflect the current content.
          </p>
        </div>
        
        <article>
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-4">{revisionData.entryTitle}</h1>
            
            {/* Revision Metadata */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Revision {revisionData.revision.revisionNumber}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>
                  Created by: {revisionData.revision.author.email}
                </p>
                <p>
                  Date: {new Date(revisionData.revision.createdAt).toLocaleDateString()} at{' '}
                  {new Date(revisionData.revision.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </header>
          
          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown>{revisionData.revision.content}</ReactMarkdown>
          </div>
        </article>
      </div>
    </div>
  );
}
