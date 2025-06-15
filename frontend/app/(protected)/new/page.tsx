'use client'

import { useState } from 'react'

import { BookOpen, Brain, Lightbulb } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { ChatInput } from '@/components/chat-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useFlashcardStore } from '@/store/flashcard-store'

export default function HomePage() {
  const router = useRouter()
  const { generateFlashcardDeck, generateFlashcardsFromPDF } = useFlashcardStore()
  const [isProcessing, setIsProcessing] = useState(false)

  const examplePrompts = [
    {
      title: 'Create flashcards about photosynthesis',
      prompt: 'photosynthesis',
      icon: <Lightbulb className="text-primary h-4 w-4" />,
    },
    {
      title: 'Generate a deck on Spanish verb conjugations',
      prompt: 'Spanish verb conjugations',
      icon: <Lightbulb className="text-primary h-4 w-4" />,
    },
    {
      title: 'Make flashcards for JavaScript fundamentals',
      prompt: 'JavaScript fundamentals',
      icon: <Lightbulb className="text-primary h-4 w-4" />,
    },
  ]

  const handlePromptClick = async (prompt: string) => {
    await handleChatInput(prompt)
  }

  const handleChatInput = async (message: string, file: File | null = null) => {
    setIsProcessing(true)

    try {
      let deckId: string | null = null

      if (file) {
        // Handle PDF file upload
        deckId = await generateFlashcardsFromPDF(file)
      } else if (message.trim()) {
        // Handle text-based flashcard generation
        deckId = await generateFlashcardDeck(message)
      }

      if (deckId) {
        // Navigate to flashcards page after creation
        router.push('/flashcards')
      }
    } catch (error) {
      console.error('Error generating flashcards:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col items-center justify-center p-3 md:p-6">
          <div className="w-full max-w-2xl space-y-3 text-center">
            {/* Added CogniFlow logo */}
            <div className="mb-4 flex justify-center">
              <div className="relative h-28 w-28">
                <Image
                  src="/logo.png"
                  alt="CogniFlow Logo"
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>
            </div>
            <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              Welcome to CogniFlow
            </h1>
            <p className="text-muted-foreground text-sm">
              Create flashcards, study, and teach concepts back to improve your learning.
            </p>
          </div>

          <div className="mt-6 grid w-full max-w-2xl grid-cols-1 gap-3 md:grid-cols-3">
            {examplePrompts.map((prompt, index) => (
              <Card
                key={index}
                className="hover:border-primary cursor-pointer border-transparent bg-white/70 transition-all hover:shadow-md"
                onClick={() => handlePromptClick(prompt.prompt)}
              >
                <CardContent className="flex items-center gap-2 p-3">
                  <div className="rounded-full bg-gradient-to-r from-blue-100 to-purple-100 p-1">
                    {prompt.icon}
                  </div>
                  <p className="text-xs">{prompt.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid w-full max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
            <Button
              size="sm"
              className="h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-sm hover:from-blue-700 hover:to-indigo-700"
              onClick={() => router.push('/flashcards')}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Create Flashcards
            </Button>
            <Button
              size="sm"
              className="h-16 border-transparent bg-gradient-to-r from-purple-50 to-indigo-50 text-sm text-purple-800 hover:from-purple-100 hover:to-indigo-100"
              variant="outline"
              onClick={() => router.push('/teach')}
            >
              <Brain className="mr-2 h-4 w-4" />
              Teach Back
            </Button>
          </div>
        </div>

        <div className="sticky bottom-0 w-full border-t bg-white/80 backdrop-blur-sm">
          <div className="container max-w-2xl py-3">
            <ChatInput
              onSendMessage={handleChatInput}
              isDisabled={isProcessing}
              placeholder="Enter a subject to generate flashcards..."
              minHeight="60px"
            />
            {isProcessing && (
              <div className="text-muted-foreground mt-1 text-center text-xs">
                Creating flashcards... You will be redirected when they are ready.
              </div>
            )}
          </div>
        </div>

        {/* <TTSTest /> */}
      </main>
    </div>
  )
}
