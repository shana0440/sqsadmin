import { useState } from 'react'
import { Link, useMatch } from '@tanstack/react-router'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const rootMatch = useMatch({ from: '__root__' })
  const session = (rootMatch.context as { session?: { user?: { name?: string; email?: string } } | null })?.session ?? null

  const userDisplayName =
    session?.user?.name || session?.user?.email || 'Signed In User'

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow dark:shadow-gray-800">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center space-x-2 text-xl font-bold text-indigo-600 dark:text-indigo-400"
            >
              <img
                src="/sqs.svg"
                alt="SQS Logo"
                width={32}
                height={32}
                className="rounded-md"
              />
              <span>SQS Admin</span>
            </Link>
          </div>
          <div className="hidden md:flex md:items-center md:space-x-6">
            <Link
              to="/"
              className="text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Queues
            </Link>
            {session && (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-300 max-w-[200px] truncate">
                  {userDisplayName}
                </span>
                <a
                  href="/api/auth/signout"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Sign Out
                </a>
              </>
            )}
          </div>
          <div className="md:hidden">
            <button
              type="button"
              className="-my-2 rounded-md p-2 inline-flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:focus:ring-indigo-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open menu</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden py-2 pb-4">
            <div className="space-y-1 px-2 pb-3 pt-2">
              <Link
                to="/"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                Queues
              </Link>
              {session && (
                <>
                  <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 truncate">
                    {userDisplayName}
                  </div>
                  <a
                    href="/api/auth/signout"
                    className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Out
                  </a>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
