'use client'

import { useEffect, useState } from 'react'

import { BookOpen, ChevronLeft, ChevronRight, Lightbulb, RotateCw, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FlashcardDeck } from '@/data/mock-flashcards'
import { cn } from '@/lib/utils'
import { useFlashcardStore } from '@/store/flashcard-store'

interface TeachingFlashcardProps {
  className?: string
}

export function TeachingFlashcard({ className }: TeachingFlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showAnimation, setShowAnimation] = useState(false)

  const decks = useFlashcardStore(state => state.decks)
  const activeTeachingDeck = useFlashcardStore(state => state.activeTeachingDeck)
  const setActiveTeachingDeck = useFlashcardStore(state => state.setActiveTeachingDeck)

  // Get flashcards for the active deck
  const flashcards = activeTeachingDeck?.flashcards || []

  // Initial animation
  useEffect(() => {
    setShowAnimation(true)
    const timer = setTimeout(() => setShowAnimation(false), 800)
    return () => clearTimeout(timer)
  }, [])

  // Reset card index when changing decks
  useEffect(() => {
    setCurrentCardIndex(0)
    setIsFlipped(false)
  }, [activeTeachingDeck])

  const currentCard = flashcards[currentCardIndex] || {
    id: 'empty',
    question: 'No flashcard available',
    answer: 'Please select a teaching deck',
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
      setIsFlipped(false)
    }
  }

  const handleNext = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setIsFlipped(false)
    }
  }

  const handleSelectDeck = (deck: FlashcardDeck) => {
    setActiveTeachingDeck(deck)
  }

  return (
    <Card
      className={cn(
        'flex flex-col overflow-visible border border-indigo-100 shadow-md',
        showAnimation && 'animate-appear',
        className
      )}
    >
      <CardHeader className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm text-indigo-900">
            <Lightbulb className="h-4 w-4 text-purple-500" />
            {activeTeachingDeck ? (
              <span className="max-w-[180px]" title={activeTeachingDeck.title}>
                {activeTeachingDeck.title}
              </span>
            ) : (
              'Select a Deck'
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            {flashcards.length > 0 && (
              <div className="text-sm font-medium text-purple-600">
                {currentCardIndex + 1} of {flashcards.length}
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-indigo-200 hover:bg-indigo-50"
                >
                  <BookOpen className="mr-1 h-4 w-4" />
                  Decks
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {decks.length === 0 ? (
                  <DropdownMenuItem disabled>No decks available</DropdownMenuItem>
                ) : (
                  decks.map(deck => (
                    <DropdownMenuItem
                      key={deck.id}
                      onClick={() => handleSelectDeck(deck)}
                      className={cn(
                        'cursor-pointer',
                        activeTeachingDeck?.id === deck.id && 'bg-indigo-50 text-indigo-700'
                      )}
                    >
                      {deck.title}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-6">
        <div className="flex h-full flex-col items-center">
          <div
            className="perspective-1000 mb-6 h-64 w-full max-w-2xl cursor-pointer md:h-80"
            onClick={handleFlip}
          >
            <div
              className={cn(
                'transform-style-3d relative h-full w-full transition-transform duration-500',
                isFlipped && 'rotate-y-180'
              )}
            >
              {/* Question side */}
              <Card
                className={cn(
                  'absolute h-full w-full border-2 backface-hidden',
                  isFlipped ? 'invisible' : 'visible',
                  'bg-card-gradient overflow-auto rounded-xl border-indigo-100'
                )}
              >
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
                <CardContent className="flex h-full flex-col p-6">
                  <div className="mb-4 flex items-center justify-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-indigo-100 to-purple-100">
                      <Sparkles className="h-5 w-5 text-indigo-600" />
                    </div>
                  </div>
                  <h3 className="mb-4 text-center text-xl font-semibold text-indigo-800">
                    Question
                  </h3>
                  <p className="text-md flex-grow overflow-auto text-center">
                    {currentCard.question}
                  </p>
                  <div className="mt-4 text-right opacity-70">
                    <p className="text-xs text-indigo-400">Click to flip</p>
                  </div>
                </CardContent>
              </Card>

              {/* Answer side */}
              <Card
                className={cn(
                  'absolute h-full w-full rotate-y-180 border-2 backface-hidden',
                  !isFlipped ? 'invisible' : 'visible',
                  'overflow-auto rounded-xl border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50'
                )}
              >
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-500"></div>
                <CardContent className="flex h-full flex-col p-6">
                  <h3 className="mb-4 text-center text-xl font-semibold text-purple-800">Answer</h3>
                  <p className="flex-grow overflow-auto text-center text-lg">
                    {currentCard.answer}
                  </p>
                  <div className="mt-4 text-right opacity-70">
                    <p className="text-xs text-purple-400">Click to flip back</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-auto flex w-full max-w-md items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={currentCardIndex === 0 || flashcards.length === 0}
              className="rounded-full border-indigo-200 transition-all hover:bg-indigo-50 hover:text-indigo-700"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous card</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleFlip}
              disabled={flashcards.length === 0}
              className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 transition-all hover:border-indigo-300 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-purple-100"
            >
              <RotateCw className="mr-2 h-4 w-4" />
              Flip Card
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={currentCardIndex === flashcards.length - 1 || flashcards.length === 0}
              className="rounded-full border-indigo-200 transition-all hover:bg-indigo-50 hover:text-indigo-700"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next card</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
