'use client'

import { useEffect, useState } from 'react'

import { User } from '@supabase/supabase-js'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import AuthButtons from './AuthButtons'

export default function PublicHeader({ user }: { user: User | null }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="relative mr-2 h-10 w-10">
                <Image src="/logo.png" alt="CogniFlow Logo" fill style={{ objectFit: 'contain' }} />
              </div>
              <span className="text-xl font-bold text-gray-900">CogniFlow</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-8 md:flex">
            <Link href="/" className="text-sm text-gray-600 transition-colors hover:text-blue-600">
              Home
            </Link>
            <Link
              href="#features"
              className="text-sm text-gray-600 transition-colors hover:text-blue-600"
            >
              Features
            </Link>
            <Link
              href="#about"
              className="text-sm text-gray-600 transition-colors hover:text-blue-600"
            >
              About
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex">
            <AuthButtons user={user} />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-4 pt-2 pb-3">
            <Link
              href="/"
              className="block py-2 text-gray-600 hover:text-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="#features"
              className="block py-2 text-gray-600 hover:text-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#about"
              className="block py-2 text-gray-600 hover:text-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <div className="mt-4 py-2">
              <AuthButtons user={user} variant="mobile" onAction={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
