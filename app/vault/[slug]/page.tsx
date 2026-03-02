'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  requiredEntitlement: string | null;
  tags: string[];
  author: {
    id: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PaywallResponse {
  error: string;
  message: string;
  paywall: boolean;
  requiredEntitlement: string;
  title: string;
  excerpt: string;
}

export default function VaultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  
  const [item, setItem] = useState<ContentItem | null>(null);
  const [paywall, setPaywall] = useState<PaywallResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchItem = async () => {
      try {
        setLoading(true);
        setError(null);
        setPaywall(null);
        
        const response = await fetch(`/api/vault/${slug}`);
        
        if (response.status === 403) {
          // Paywall - user lacks required entitlement
          const data = await response.json();
          setPaywall(data);
          return;
        }
        
        if (response.status === 404) {
          setError('Content not found');
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        
        const data = await response.json();
        setItem(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
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
            href="/vault"
            className="inline-block px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            ← Back to Vault
          </Link>
        </div>
      </div>
    );
  }

  // Paywall state
  if (paywall) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/vault"
            className="inline-block mb-6 text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Vault
          </Link>
          
          <div className="border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-8 bg-yellow-50 dark:bg-yellow-900/20">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔒</div>
              <h1 className="text-3xl font-bold mb-4">{paywall.title}</h1>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                {paywall.excerpt}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-3">Premium Content</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {paywall.message}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Required: <span className="font-semibold">{paywall.requiredEntitlement}</span>
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/billing/checkout/monthly"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-semibold"
              >
                Upgrade to Monthly
              </Link>
              <Link
                href="/billing/checkout/lifetime"
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center font-semibold"
              >
                Get Lifetime Access
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Content display
  if (!item) {
    return null;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/vault"
          className="inline-block mb-6 text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Vault
        </Link>
        
        <article>
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-4">{item.title}</h1>
            
            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* Metadata */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>
                By {item.author.email} • {new Date(item.createdAt).toLocaleDateString()}
              </p>
              {item.requiredEntitlement && (
                <p className="mt-1">
                  🔓 Access granted with: {item.requiredEntitlement}
                </p>
              )}
            </div>
          </header>
          
          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown>{item.content}</ReactMarkdown>
          </div>
        </article>
      </div>
    </div>
  );
}
