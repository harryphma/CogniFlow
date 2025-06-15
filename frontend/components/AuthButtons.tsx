'use client'

import { User } from '@supabase/supabase-js'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

type AuthButtonsProps = {
  user: User | null
  variant?: 'default' | 'mobile'
  onAction?: () => void
}

export default function AuthButtons({ user, variant = 'default', onAction }: AuthButtonsProps) {
  const handleClick = () => {
    if (onAction) {
      onAction()
    }
  }

  if (user) {
    // User is logged in - show logout button
    if (variant === 'mobile') {
      return (
        <Button
          size="sm"
          variant="outline"
          className="w-full text-gray-800 hover:bg-gray-100"
          asChild
        >
          <Link href="/auth/logout" onClick={handleClick}>
            Log Out
          </Link>
        </Button>
      )
    }

    return (
      <Button size="sm" variant="outline" className="text-gray-800 hover:bg-gray-100" asChild>
        <Link href="/auth/logout">Log Out</Link>
      </Button>
    )
  }

  // User is not logged in - show login button
  if (variant === 'mobile') {
    return (
      <Button
        size="sm"
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
        asChild
      >
        <Link href="/auth/login" onClick={handleClick}>
          Log In
        </Link>
      </Button>
    )
  }

  return (
    <Button
      size="sm"
      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
      asChild
    >
      <Link href="/auth/login">Log In</Link>
    </Button>
  )
}
