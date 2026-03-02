'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { EntitlementType } from '@prisma/client';

interface UserDetail {
  user: {
    id: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    entitlements: {
      type: EntitlementType;
      grantedAt: string;
    }[];
  };
  stats: {
    journalCount: number;
    ritualCount: number;
    vaultCreatedCount: number;
    grimoireRevisionCount: number;
  };
}

const ENTITLEMENT_TYPES: EntitlementType[] = [
  EntitlementType.vault_access,
  EntitlementType.grimoire_access,
  EntitlementType.admin,
];

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;

  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showGrantDialog, setShowGrantDialog] = useState(false);

  useEffect(() => {
    fetchUserDetail();
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }
      const data = await response.json();
      setUserDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantEntitlement = async (entitlementType: EntitlementType) => {
    try {
      setActionLoading(`grant-${entitlementType}`);
      const response = await fetch(`/api/admin/users/${userId}/entitlements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: entitlementType }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to grant entitlement');
      }

      // Refresh user details
      await fetchUserDetail();
      setShowGrantDialog(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to grant entitlement');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeEntitlement = async (entitlementType: EntitlementType) => {
    if (!confirm(`Are you sure you want to revoke ${entitlementType} from this user?`)) {
      return;
    }

    try {
      setActionLoading(`revoke-${entitlementType}`);
      const response = await fetch(`/api/admin/users/${userId}/entitlements/${entitlementType}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to revoke entitlement');
      }

      // Refresh user details
      await fetchUserDetail();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to revoke entitlement');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !userDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error || 'User not found'}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={fetchUserDetail}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
            <Link
              href="/admin/users"
              className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Back to Users
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasEntitlement = (type: EntitlementType) =>
    userDetail.user.entitlements.some((e) => e.type === type);

  const availableEntitlements = ENTITLEMENT_TYPES.filter((type) => !hasEntitlement(type));

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">User Details</h1>
          <Link
            href="/admin/users"
            className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Back to Users
          </Link>
        </div>

        {/* User Information */}
        <div className="border rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">{userDetail.user.email}</h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              User ID: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{userDetail.user.id}</code>
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Joined: {new Date(userDetail.user.createdAt).toLocaleString()}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Last Updated: {new Date(userDetail.user.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="border rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Usage Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
              <p className="text-2xl font-bold">{userDetail.stats.journalCount}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Journal Entries</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
              <p className="text-2xl font-bold">{userDetail.stats.ritualCount}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rituals</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
              <p className="text-2xl font-bold">{userDetail.stats.vaultCreatedCount}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vault Items Created</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
              <p className="text-2xl font-bold">{userDetail.stats.grimoireRevisionCount}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Grimoire Revisions</p>
            </div>
          </div>
        </div>

        {/* Entitlements */}
        <div className="border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Entitlements</h3>
            {availableEntitlements.length > 0 && (
              <button
                onClick={() => setShowGrantDialog(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                Grant Entitlement
              </button>
            )}
          </div>

          {userDetail.user.entitlements.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-4">
              No entitlements granted
            </p>
          ) : (
            <div className="space-y-3">
              {userDetail.user.entitlements.map((entitlement) => (
                <div
                  key={entitlement.type}
                  className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <div>
                    <p className="font-semibold">{entitlement.type}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Granted: {new Date(entitlement.grantedAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevokeEntitlement(entitlement.type)}
                    disabled={actionLoading === `revoke-${entitlement.type}`}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50"
                  >
                    {actionLoading === `revoke-${entitlement.type}` ? 'Revoking...' : 'Revoke'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Grant Entitlement Dialog */}
        {showGrantDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Grant Entitlement</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select an entitlement to grant to {userDetail.user.email}
              </p>
              <div className="space-y-2 mb-6">
                {availableEntitlements.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleGrantEntitlement(type)}
                    disabled={actionLoading === `grant-${type}`}
                    className="w-full px-4 py-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-left disabled:opacity-50"
                  >
                    {actionLoading === `grant-${type}` ? 'Granting...' : type}
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowGrantDialog(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                  disabled={actionLoading !== null}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
