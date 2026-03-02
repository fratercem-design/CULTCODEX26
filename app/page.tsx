import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="max-w-2xl w-full">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Cult of Psyche Vault + Grimoire
        </h1>
        <p className="text-lg mb-8 text-center text-gray-600 dark:text-gray-400">
          Welcome to the membership platform MVP
        </p>
        <nav className="grid grid-cols-2 gap-4">
          <Link
            href="/login"
            className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center"
          >
            Sign Up
          </Link>
          <Link
            href="/vault"
            className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center"
          >
            Vault
          </Link>
          <Link
            href="/grimoire"
            className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center"
          >
            Grimoire
          </Link>
          <Link
            href="/journal"
            className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center"
          >
            Journal
          </Link>
          <Link
            href="/rituals"
            className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center"
          >
            Rituals
          </Link>
          <Link
            href="/admin"
            className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center col-span-2"
          >
            Admin Console
          </Link>
        </nav>
      </main>
    </div>
  );
}
