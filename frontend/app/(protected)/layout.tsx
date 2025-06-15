'use client'

import { BookOpen, Brain, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const routes = [
    { name: 'Home', path: '/new', icon: <Home className="h-5 w-5" /> },
    { name: 'Flashcards', path: '/flashcards', icon: <BookOpen className="h-5 w-5" /> },
    { name: 'Teach Back', path: '/teach', icon: <Brain className="h-5 w-5" /> },
  ]

  return (
    /* Full-height column → the page itself never scrolls */
    <div className="flex h-screen flex-col overflow-hidden">
      {/* ---------- header ---------- */}
      <header className="flex-none border-b">
        <div className="flex h-[64px] items-center px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="text-primary h-6 w-6" />
            <span className="text-xl font-bold">CogniFlow</span>
          </Link>

          <nav className="ml-auto hidden items-center gap-6 md:flex">
            {routes.map(r => (
              <Link
                key={r.path}
                href={r.path}
                className={cn(
                  'hover:text-primary flex items-center gap-2 text-sm font-medium transition-colors',
                  pathname === r.path ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {r.icon} {r.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* ---------- content area ---------- */}
      <main className="flex min-h-0 flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
