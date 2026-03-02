'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EntitlementType } from '@prisma/client';

interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  entitlements: {
    id: string;
    entitlementType: EntitlementType;
    grantedAt: string;
  }[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
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
            onClick={fetchUsers}
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
          <h1 className="text-3xl font-bold">User Management</h1>
          <Link
            href="/admin"
            className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Back to Admin
          </Link>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">No users found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <Link
                key={user.id}
                href={`/admin/users/${user.id}`}
                className="block border rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">{user.email}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      User ID: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">{user.id}</code>
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {user.entitlements.length === 0 ? (
                        <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm">
                          No entitlements
                        </span>
                      ) : (
                        user.entitlements.map((entitlement) => (
                          <span
                            key={entitlement.id}
                            className="px-2 py-1 bg-blue-200 dark:bg-blue-700 rounded text-sm"
                          >
                            {entitlement.entitlementType}
                          </span>
                        ))
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Joined: {new Date(user.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className="text-sm text-blue-600 dark:text-blue-400">
                      View Details →
                    </span>
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
