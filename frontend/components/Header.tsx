'use client'

import Link from 'next/link'

import UserProfile from './UserProfile'

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold text-gray-900">
            CogniFlow
          </Link>
        </div>
        <div className="flex items-center">
          <UserProfile />
        </div>
      </div>
    </header>
  )
}
