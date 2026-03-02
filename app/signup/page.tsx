import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold mb-8 text-center">Sign Up</h1>
        <div className="border rounded-lg p-8">
          <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
            Signup functionality will be implemented in Task 2
          </p>
          <div className="flex justify-center gap-4 mt-8">
            <Link
              href="/"
              className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Back to Home
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
