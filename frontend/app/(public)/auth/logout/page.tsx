'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import { createClient } from '@/utils/supabase/client'

export default function LogoutPage() {
  const router = useRouter()

  const supabase = createClient()

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        await supabase.auth.signOut()
        router.push('/')
      } catch (error) {
        console.error('Error signing out:', error)
        // Redirect to home even if there's an error
        router.push('/')
      }
    }

    handleSignOut()
  }, [router, supabase.auth])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-2 text-2xl font-semibold">Signing out...</h1>
        <p className="text-gray-600">You are being logged out and redirected.</p>
      </div>
    </div>
  )
}
