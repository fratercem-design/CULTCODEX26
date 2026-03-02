'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // Fetch journal entries
  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/journal');
      
      if (!response.ok) {
        throw new Error('Failed to fetch journal entries');
      }
      
      const data = await response.json();
      setEntries(data.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch entries on mount
  useEffect(() => {
    fetchEntries();
  }, []);

  // Handle new entry button
  const handleNewEntry = () => {
    setEditingEntry(null);
    setFormData({ title: '', content: '' });
    setShowForm(true);
  };

  // Handle edit button
  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setFormData({ title: entry.title, content: entry.content });
    setShowForm(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Title and content are required');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const url = editingEntry ? `/api/journal/${editingEntry.id}` : '/api/journal';
      const method = editingEntry ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save entry');
      }
      
      // Reset form and refresh entries
      setShowForm(false);
      setEditingEntry(null);
      setFormData({ title: '', content: '' });
      await fetchEntries();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/journal/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete entry');
      }
      
      await fetchEntries();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const response = await fetch('/api/journal/export');
      
      if (!response.ok) {
        throw new Error('Failed to export journal');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `journal-export-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Toggle entry expansion
  const toggleExpand = (id: string) => {
    setExpandedEntryId(expandedEntryId === id ? null : id);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Journal</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your private notes and reflections
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Export All
            </button>
            <button
              onClick={handleNewEntry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              New Entry
            </button>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingEntry ? 'Edit Entry' : 'New Entry'}
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Content (Markdown supported)
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 min-h-[300px]"
                    required
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingEntry(null);
                      setFormData({ title: '', content: '' });
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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

        {/* Journal Entries */}
        {!loading && !error && (
          <>
            {entries.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No journal entries yet. Start writing!
                </p>
                <button
                  onClick={handleNewEntry}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First Entry
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="border rounded-lg p-6 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-semibold mb-2">{entry.title}</h2>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span>Created: {new Date(entry.createdAt).toLocaleString()}</span>
                          {entry.updatedAt !== entry.createdAt && (
                            <span className="ml-4">
                              Updated: {new Date(entry.updatedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="px-3 py-1 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    {/* Content Preview/Full */}
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      {expandedEntryId === entry.id ? (
                        <>
                          <ReactMarkdown>{entry.content}</ReactMarkdown>
                          <button
                            onClick={() => toggleExpand(entry.id)}
                            className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Show less
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="line-clamp-3">
                            <ReactMarkdown>{entry.content}</ReactMarkdown>
                          </div>
                          <button
                            onClick={() => toggleExpand(entry.id)}
                            className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Read more
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
