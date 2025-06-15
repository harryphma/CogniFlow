'use client'

import { useEffect, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, RotateCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FlashcardData } from '@/data/mock-flashcards'
import { cn } from '@/lib/utils'
import { decksService } from '@/lib/services'

interface FlashcardViewerProps {
  title?: string
  deckId?: string
}

export function FlashcardViewer({ title, deckId }: FlashcardViewerProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const [cards, setCards] = useState<FlashcardData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch cards from Supabase when deckId changes
  useEffect(() => {
    async function fetchCards() {
      if (!deckId) {
        setCards([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const fetchedCards = await decksService.getFlashcardsForDeck(deckId)
        setCards(fetchedCards)
      } catch (error) {
        console.error('Error fetching flashcards:', error)
        setCards([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCards()
    setCurrentCardIndex(0) // Reset to first card when deck changes
    setIsFlipped(false)
  }, [deckId])

  const currentCard = cards.length ? cards[currentCardIndex] : null

  /* ---------- mount / card-change animation ---------- */
  useEffect(() => {
    setShowAnimation(true)
    const t = setTimeout(() => setShowAnimation(false), 800)
    return () => clearTimeout(t)
  }, [cards])

  /* ---------- handlers ---------- */
  const handleFlip = () => {
    if (!isFlipping && cards.length) {
      setIsFlipping(true)
      setTimeout(() => {
        setIsFlipped(prev => !prev)
        setIsFlipping(false)
      }, 550)
    }
  }

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(i => i - 1)
      setIsFlipped(false)
    }
  }

  const handleNext = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(i => i + 1)
      setIsFlipped(false)
    }
  }

  /* ---------- loading state ---------- */
  if (isLoading) {
    return (
      <div className="flex w-full max-w-2xl flex-col items-center justify-center rounded-2xl border border-purple-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-8 shadow-sm">
        <p className="text-center font-medium text-indigo-600">Loading flashcards...</p>
      </div>
    )
  }

  /* ---------- empty-deck state ---------- */
  if (!cards.length) {
    return (
      <div className="flex w-full max-w-2xl flex-col items-center justify-center rounded-2xl border border-purple-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-8 shadow-sm">
        <BookOpen className="mb-4 h-12 w-12 text-indigo-300 opacity-70" />
        <p className="text-center font-medium text-indigo-600">
          No flashcards available in this deck. Create some flashcards to get started!
        </p>
      </div>
    )
  }

  /* ---------- normal viewer ---------- */
  return (
    <div
      className={cn(
        'flex min-h-0 w-full max-w-2xl flex-1 flex-col',
        showAnimation && 'animate-appear'
      )}
    >
      {title && (
        <div className="relative mb-6 flex items-center gap-2">
          <h2 className="text-xl font-semibold text-indigo-900">{title}</h2>
        </div>
      )}

      {/* ---- scrollable card area ---- */}
      <div className="min-h-0 flex-1">
        <div
          className="perspective-1000 relative aspect-[3/2] min-h-[200px] w-full cursor-pointer"
          onClick={handleFlip}
        >
          <div
            className={cn(
              'transform-style-3d relative h-full w-full transition-transform duration-500 ease-in-out',
              isFlipped && 'rotate-y-180'
            )}
          >
            {/* Question side */}
            <div
              className={cn(
                'absolute inset-0 rounded-2xl backface-hidden',
                !isFlipped ? 'visible' : 'invisible'
              )}
            >
              <Card className="bg-card-gradient flex h-full w-full flex-col justify-center overflow-hidden rounded-2xl border-2 border-indigo-100 shadow-lg">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-600" />
                <div className="mb-4 flex items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-indigo-100 to-purple-100">
                    <Sparkles className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
                <h3 className="mb-2 text-center text-lg font-semibold text-indigo-800">Question</h3>
                <div className="max-h-[240px] overflow-auto px-8 py-4">
                  <p className="text-center text-lg">{currentCard?.question}</p>
                </div>
                <div className="absolute right-3 bottom-3 opacity-70">
                  <p className="text-xs text-indigo-400">Click to flip</p>
                </div>
              </Card>
            </div>

            {/* Answer side */}
            <div
              className={cn(
                'absolute inset-0 rotate-y-180 rounded-2xl backface-hidden',
                isFlipped ? 'visible' : 'invisible'
              )}
            >
              <Card className="flex h-full w-full flex-col justify-center overflow-hidden rounded-2xl border-2 border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-lg">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-500" />
                <h3 className="mb-2 text-center text-lg font-semibold text-purple-800">Answer</h3>
                <div className="max-h-[240px] overflow-auto px-8 py-4">
                  <p className="text-center text-lg">{currentCard?.answer}</p>
                </div>
                <div className="absolute right-3 bottom-3 opacity-70">
                  <p className="text-xs text-purple-400">Click to flip back</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* ---- navigation footer ---- */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          disabled={currentCardIndex === 0}
          className="rounded-full border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous card</span>
        </Button>

        <div className="text-center">
          <div className="text-sm font-medium text-purple-600">
            Card {currentCardIndex + 1} of {cards.length}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800"
            onClick={() => setIsFlipped(false)}
          >
            <RotateCw className="mr-2 h-3 w-3" />
            Flip back
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={currentCardIndex === cards.length - 1}
          className="rounded-full border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next card</span>
        </Button>
      </div>
    </div>
  )
}