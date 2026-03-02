'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface GrimoireEntry {
  id: string;
  title: string;
  slug: string;
  currentRevisionId: string | null;
  revisionCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminGrimoirePage() {
  const [entries, setEntries] = useState<GrimoireEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<GrimoireEntry | null>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/grimoire');
      if (!response.ok) {
        throw new Error('Failed to fetch grimoire entries');
      }
      const data = await response.json();
      
      // Fetch revision counts for each entry
      const entriesWithCounts = await Promise.all(
        (data.entries || []).map(async (entry: any) => {
          const revisionsResponse = await fetch(`/api/grimoire/${entry.slug}/revisions`);
          let revisionCount = 0;
          if (revisionsResponse.ok) {
            const revisionsData = await revisionsResponse.json();
            revisionCount = revisionsData.revisions?.length || 0;
          }
          return {
            id: entry.id,
            title: entry.title,
            slug: entry.slug,
            currentRevisionId: entry.currentRevision?.id || null,
            revisionCount,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
          };
        })
      );
      
      setEntries(entriesWithCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will delete all revisions.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/grimoire/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete grimoire entry');
      }

      // Refresh the list
      await fetchEntries();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete grimoire entry');
    }
  };

  const handleEdit = (entry: GrimoireEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingEntry(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingEntry(null);
    fetchEntries();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchEntries}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Grimoire Management</h1>
          <div className="flex gap-4">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create New
            </button>
            <Link
              href="/admin"
              className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Back to Admin
            </Link>
          </div>
        </div>

        {showForm && (
          <GrimoireEntryForm
            entry={editingEntry}
            onClose={handleFormClose}
          />
        )}

        {entries.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No grimoire entries found
            </p>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create First Entry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">{entry.title}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Slug: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{entry.slug}</code>
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                      Revisions: {entry.revisionCount}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Updated: {new Date(entry.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/grimoire/${entry.slug}/revisions`}
                      className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                    >
                      View History
                    </Link>
                    <button
                      onClick={() => handleEdit(entry)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id, entry.title)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface GrimoireEntryFormProps {
  entry: GrimoireEntry | null;
  onClose: () => void;
}

function GrimoireEntryForm({ entry, onClose }: GrimoireEntryFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingEntry, setLoadingEntry] = useState(false);

  // Load entry data when editing
  useEffect(() => {
    if (entry) {
      const loadEntryData = async () => {
        try {
          setLoadingEntry(true);
          const response = await fetch(`/api/grimoire/${entry.slug}`);
          if (!response.ok) {
            throw new Error('Failed to load entry data');
          }
          const data = await response.json();
          setFormData({
            title: data.title || '',
            slug: data.slug || '',
            content: data.currentRevision?.content || '',
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load entry');
        } finally {
          setLoadingEntry(false);
        }
      };
      loadEntryData();
    }
  }, [entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
      };

      const url = entry ? `/api/admin/grimoire/${entry.id}` : '/api/admin/grimoire';
      const method = entry ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save grimoire entry');
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingEntry) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
          <p>Loading entry data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {entry ? 'Edit Grimoire Entry' : 'Create Grimoire Entry'}
        </h2>

        {entry && (
          <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded text-blue-700 dark:text-blue-300">
            Editing will create a new revision. Previous versions will be preserved.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
              required
            />
          </div>

          {!entry && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Slug * (URL-friendly, lowercase with hyphens)
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Slug cannot be changed after creation
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Content * (Markdown)
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 h-64"
              required
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : entry ? 'Update (Create Revision)' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
