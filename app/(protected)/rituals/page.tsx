'use client';

import { useState, useEffect } from 'react';

interface RitualInstance {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  createdAt: string;
  updatedAt: string;
}

export default function RitualsPage() {
  const [rituals, setRituals] = useState<RitualInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRitual, setEditingRitual] = useState<RitualInstance | null>(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    scheduledAt: '' 
  });
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'month'>('list');

  // Fetch rituals
  const fetchRituals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/rituals');
      
      if (!response.ok) {
        throw new Error('Failed to fetch rituals');
      }
      
      const data = await response.json();
      setRituals(data.rituals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch rituals on mount
  useEffect(() => {
    fetchRituals();
  }, []);

  // Handle new ritual button
  const handleNewRitual = () => {
    setEditingRitual(null);
    setFormData({ 
      title: '', 
      description: '', 
      scheduledAt: new Date().toISOString().slice(0, 16) 
    });
    setShowForm(true);
  };

  // Handle edit button
  const handleEdit = (ritual: RitualInstance) => {
    setEditingRitual(ritual);
    setFormData({ 
      title: ritual.title, 
      description: ritual.description || '', 
      scheduledAt: new Date(ritual.scheduledAt).toISOString().slice(0, 16)
    });
    setShowForm(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.scheduledAt) {
      alert('Title and scheduled date/time are required');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const url = editingRitual ? `/api/rituals/${editingRitual.id}` : '/api/rituals';
      const method = editingRitual ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save ritual');
      }
      
      // Reset form and refresh rituals
      setShowForm(false);
      setEditingRitual(null);
      setFormData({ title: '', description: '', scheduledAt: '' });
      await fetchRituals();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ritual?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/rituals/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete ritual');
      }
      
      await fetchRituals();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Handle export to ICS
  const handleExport = async () => {
    try {
      const response = await fetch('/api/rituals/export');
      
      if (!response.ok) {
        throw new Error('Failed to export rituals');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rituals-export-${new Date().toISOString().split('T')[0]}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Group rituals by month for calendar view
  const getRitualsByMonth = () => {
    const grouped: { [key: string]: RitualInstance[] } = {};
    
    rituals.forEach(ritual => {
      const date = new Date(ritual.scheduledAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(ritual);
    });
    
    return grouped;
  };

  const ritualsByMonth = getRitualsByMonth();
  const sortedMonths = Object.keys(ritualsByMonth).sort().reverse();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Ritual Calendar</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track and manage your ritual practice
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Export to Calendar
            </button>
            <button
              onClick={handleNewRitual}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              New Ritual
            </button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'month'
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            Month View
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingRitual ? 'Edit Ritual' : 'New Ritual'}
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
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 min-h-[100px]"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Scheduled Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingRitual(null);
                      setFormData({ title: '', description: '', scheduledAt: '' });
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

        {/* Rituals Display */}
        {!loading && !error && (
          <>
            {rituals.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No rituals scheduled yet. Create your first ritual!
                </p>
                <button
                  onClick={handleNewRitual}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First Ritual
                </button>
              </div>
            ) : (
              <>
                {/* List View */}
                {viewMode === 'list' && (
                  <div className="space-y-4">
                    {rituals.map((ritual) => (
                      <div
                        key={ritual.id}
                        className="border rounded-lg p-6 dark:border-gray-700"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h2 className="text-2xl font-semibold mb-2">{ritual.title}</h2>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <span className="font-medium">Scheduled:</span>{' '}
                              {new Date(ritual.scheduledAt).toLocaleString()}
                            </div>
                            {ritual.description && (
                              <p className="text-gray-700 dark:text-gray-300 mt-2">
                                {ritual.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(ritual)}
                              className="px-3 py-1 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(ritual.id)}
                              className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Month View */}
                {viewMode === 'month' && (
                  <div className="space-y-8">
                    {sortedMonths.map((monthKey) => {
                      const [year, month] = monthKey.split('-');
                      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
                      const monthRituals = ritualsByMonth[monthKey].sort((a, b) => 
                        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
                      );

                      return (
                        <div key={monthKey} className="border rounded-lg p-6 dark:border-gray-700">
                          <h2 className="text-2xl font-bold mb-4">{monthName}</h2>
                          <div className="space-y-3">
                            {monthRituals.map((ritual) => (
                              <div
                                key={ritual.id}
                                className="flex justify-between items-start p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="flex items-baseline gap-3 mb-1">
                                    <span className="text-lg font-semibold">
                                      {new Date(ritual.scheduledAt).toLocaleDateString('default', { day: 'numeric' })}
                                    </span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {new Date(ritual.scheduledAt).toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <h3 className="text-lg font-medium mb-1">{ritual.title}</h3>
                                  {ritual.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {ritual.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <button
                                    onClick={() => handleEdit(ritual)}
                                    className="px-3 py-1 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(ritual.id)}
                                    className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
