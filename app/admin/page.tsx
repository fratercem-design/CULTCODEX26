import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { EntitlementType } from "@prisma/client";

export default async function AdminPage() {
  // Check authentication
  const session = await getSession();
  
  if (!session || !session.userId) {
    redirect("/login?error=unauthorized");
  }

  // Check admin entitlement
  const adminEntitlement = await prisma.entitlement.findUnique({
    where: {
      userId_entitlementType: {
        userId: session.userId,
        entitlementType: EntitlementType.admin,
      },
    },
  });

  if (!adminEntitlement) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          <h1 className="text-3xl font-bold mb-8 text-center text-red-600">Access Denied</h1>
          <div className="border border-red-300 rounded-lg p-8 bg-red-50 dark:bg-red-900/20">
            <p className="text-center text-gray-700 dark:text-gray-300 mb-4">
              You do not have permission to access the Admin Console.
            </p>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
              Admin entitlement is required to view this page.
            </p>
            <div className="flex justify-center mt-8">
              <Link
                href="/"
                className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-8 text-center">Admin Console</h1>
        <div className="border rounded-lg p-8">
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Manage platform content, users, and view audit logs
          </p>
          
          <div className="space-y-4">
            <Link
              href="/admin/vault"
              className="block w-full px-6 py-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center"
            >
              <h2 className="text-xl font-semibold mb-2">Vault Management</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create, edit, and delete vault content items
              </p>
            </Link>

            <Link
              href="/admin/grimoire"
              className="block w-full px-6 py-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center"
            >
              <h2 className="text-xl font-semibold mb-2">Grimoire Management</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create, edit, and delete grimoire entries with revision tracking
              </p>
            </Link>

            <Link
              href="/admin/users"
              className="block w-full px-6 py-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center"
            >
              <h2 className="text-xl font-semibold mb-2">User Management</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage users and their entitlements
              </p>
            </Link>

            <Link
              href="/admin/audit"
              className="block w-full px-6 py-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center"
            >
              <h2 className="text-xl font-semibold mb-2">Audit Logs</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View platform activity and administrative actions
              </p>
            </Link>
          </div>

          <div className="flex justify-center mt-8">
            <Link
              href="/"
              className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
