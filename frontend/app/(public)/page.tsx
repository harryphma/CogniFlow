'use client'

import { useState } from 'react'
import { useEffect } from 'react'

import { User } from '@supabase/supabase-js'
import { ArrowRight, BookOpen, Brain, Check } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import PublicHeader from '../../components/PublicHeader'

import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'

export default function LandingPage() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      console.log(user)
    }
    fetchUser()
  }, [])
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader user={user} />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="mb-6 flex justify-center">
              <div className="relative h-32 w-32">
                <Image
                  src="/logo.png"
                  alt="CogniFlow Logo"
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>
            </div>
            <h1 className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl">
              Learn Smarter with CogniFlow
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-lg text-gray-600">
              Create AI-powered flashcards, study effectively, and teach concepts back to accelerate
              your learning.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
                asChild
              >
                <Link href="/new">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">Why Choose CogniFlow?</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="rounded-lg bg-white p-6 shadow-md">
                <div className="mb-4 inline-block rounded-full bg-blue-100 p-3 text-blue-600">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">AI-Powered Flashcards</h3>
                <p className="text-gray-600">
                  Generate comprehensive flashcard decks on any subject with our advanced AI. Simply
                  type a topic or upload materials.
                </p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-md">
                <div className="mb-4 inline-block rounded-full bg-purple-100 p-3 text-purple-600">
                  <Brain className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">Teach Back Method</h3>
                <p className="text-gray-600">
                  Solidify your knowledge by teaching concepts back to our AI, which provides
                  feedback to strengthen understanding.
                </p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-md">
                <div className="mb-4 inline-block rounded-full bg-green-100 p-3 text-green-600">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">Effective Learning</h3>
                <p className="text-gray-600">
                  Our platform combines proven learning techniques with AI technology to help you
                  learn faster and retain information longer.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-blue-600 to-purple-600 py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-6 text-3xl font-bold">
              Ready to Transform Your Learning Experience?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-lg">
              Join thousands of students and professionals who have improved their learning
              efficiency with CogniFlow.
            </p>
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" asChild>
              <Link href="/auth/login">Start Learning Now</Link>
            </Button>
          </div>
        </section>
      </main>
      <footer className="bg-gray-100 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} CogniFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
