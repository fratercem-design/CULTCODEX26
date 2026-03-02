'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type EntitlementType = 'admin' | 'vault_access' | 'grimoire_access';

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  requiredEntitlement: EntitlementType | null;
  authorId: string;
  tags: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminVaultPage() {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

  useEffect(() => {
    fetchContentItems();
  }, []);

  const fetchContentItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vault');
      if (!response.ok) {
        throw new Error('Failed to fetch content items');
      }
      const data = await response.json();
      setContentItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content item?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/vault/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete content item');
      }

      // Refresh the list
      await fetchContentItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete content item');
    }
  };

  const handleEdit = (item: ContentItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingItem(null);
    fetchContentItems();
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
            onClick={fetchContentItems}
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
          <h1 className="text-3xl font-bold">Vault Content Management</h1>
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
          <ContentItemForm
            item={editingItem}
            onClose={handleFormClose}
          />
        )}

        {contentItems.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No content items found
            </p>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create First Item
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {contentItems.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Slug: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{item.slug}</code>
                    </p>
                    {item.requiredEntitlement && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                        Required: {item.requiredEntitlement}
                      </p>
                    )}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {item.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Updated: {new Date(item.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                  {item.content.substring(0, 200)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ContentItemFormProps {
  item: ContentItem | null;
  onClose: () => void;
}

function ContentItemForm({ item, onClose }: ContentItemFormProps) {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    slug: item?.slug || '',
    content: item?.content || '',
    requiredEntitlement: item?.requiredEntitlement || '',
    tags: item?.tags.map((t) => t.name).join(', ') || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const tags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        requiredEntitlement: formData.requiredEntitlement || null,
        tags,
      };

      const url = item ? `/api/admin/vault/${item.id}` : '/api/admin/vault';
      const method = item ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save content item');
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {item ? 'Edit Content Item' : 'Create Content Item'}
        </h2>

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
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Content * (Markdown)
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 h-48"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Required Entitlement
            </label>
            <select
              value={formData.requiredEntitlement}
              onChange={(e) => setFormData({ ...formData, requiredEntitlement: e.target.value })}
              className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">None (Public)</option>
              <option value="vault_access">vault_access</option>
              <option value="grimoire_access">grimoire_access</option>
              <option value="admin">admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
              placeholder="tag1, tag2, tag3"
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
              {submitting ? 'Saving...' : item ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
