'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  actionType: string;
  resourceType: string;
  resourceId: string;
  metadata: any;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Filters
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');

  useEffect(() => {
    fetchAuditLogs();
  }, [pagination.page, actionTypeFilter, resourceTypeFilter]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (actionTypeFilter) {
        params.append('actionType', actionTypeFilter);
      }
      if (resourceTypeFilter) {
        params.append('resourceType', resourceTypeFilter);
      }

      const response = await fetch(`/api/admin/audit?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      const data = await response.json();
      setLogs(data.logs || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const toggleMetadata = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  const handleFilterChange = () => {
    // Reset to page 1 when filters change
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchAuditLogs}
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
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <Link
            href="/admin"
            className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Back to Admin
          </Link>
        </div>

        {/* Filters */}
        <div className="border rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Action Type</label>
              <input
                type="text"
                value={actionTypeFilter}
                onChange={(e) => {
                  setActionTypeFilter(e.target.value);
                  handleFilterChange();
                }}
                placeholder="e.g., admin.user.grant"
                className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Resource Type</label>
              <input
                type="text"
                value={resourceTypeFilter}
                onChange={(e) => {
                  setResourceTypeFilter(e.target.value);
                  handleFilterChange();
                }}
                placeholder="e.g., User, ContentItem"
                className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setActionTypeFilter('');
                  setResourceTypeFilter('');
                  handleFilterChange();
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Pagination Info */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {logs.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
        </div>

        {/* Audit Log Table */}
        {logs.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">No audit logs found</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Resource ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => (
                    <>
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="max-w-xs truncate" title={log.adminEmail}>
                            {log.adminEmail}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                            {log.actionType}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-sm">{log.resourceType}</td>
                        <td className="px-4 py-3 text-sm">
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                            {log.resourceId.substring(0, 8)}...
                          </code>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => toggleMetadata(log.id)}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {expandedLog === log.id ? 'Hide' : 'Show'}
                          </button>
                        </td>
                      </tr>
                      {expandedLog === log.id && (
                        <tr>
                          <td colSpan={6} className="px-4 py-3 bg-gray-50 dark:bg-gray-800">
                            <div className="text-sm">
                              <p className="font-semibold mb-2">Metadata:</p>
                              <pre className="bg-white dark:bg-gray-900 p-3 rounded border overflow-x-auto text-xs">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                Full Resource ID: <code>{log.resourceId}</code>
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
              className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    className={`px-3 py-2 border rounded ${
                      pagination.page === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    } disabled:opacity-50`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || loading}
              className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {loading && logs.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Loading...
          </div>
        )}
      </div>
    </div>
  );
}
