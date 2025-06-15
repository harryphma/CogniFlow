'use client'

import Link from 'next/link'

export default function AuthCodeErrorPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Authentication Error</h2>
        <p className="mt-2 text-sm text-gray-600">
          There was a problem with the authentication process. Please try again.
        </p>
      </div>

      <div className="flex justify-center">
        <Link
          href="/auth/login"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          Return to Login
        </Link>
      </div>
    </div>
  )
}
