'use client'

import { useEffect, useState } from 'react'

import { BookOpen, Clock, Plus, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FlashcardDeck } from '@/data/mock-flashcards'
import { getUserInfo } from '@/lib/api/auth'
import { decksService } from '@/lib/services/'
import { cn } from '@/lib/utils'

interface FlashcardDeckListProps {
  onDeckSelect?: (deck: FlashcardDeck) => void
  onCreateNew?: () => void
  disableCreateButton?: boolean
  decks?: FlashcardDeck[]
  selectedDeckId?: string | null
}

export function FlashcardDeckList({
  onDeckSelect,
  onCreateNew,
  disableCreateButton,
  selectedDeckId: propSelectedDeckId,
}: FlashcardDeckListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(propSelectedDeckId || null)
  const [animateDeckId, setAnimateDeckId] = useState<string | null>(null)
  const [userDecks, setUserDecks] = useState<FlashcardDeck[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  /* sync selection with parent */
  useEffect(() => {
    if (propSelectedDeckId) {
      setSelectedDeckId(propSelectedDeckId)
      setAnimateDeckId(propSelectedDeckId)
      setTimeout(() => setAnimateDeckId(null), 1000)
    }
  }, [propSelectedDeckId])

  const handleDeckClick = (deck: FlashcardDeck) => {
    setSelectedDeckId(deck.id)
    onDeckSelect?.(deck)
  }

  /* auto-select first deck */
  useEffect(() => {
    if (userDecks.length && !selectedDeckId) {
      const first = userDecks[0]
      setSelectedDeckId(first.id)
      onDeckSelect?.(first)
    }
  }, [userDecks, selectedDeckId, onDeckSelect])

  //Fetch decks from supabase
  useEffect(() => {
    async function fetchUserDecksAndCounts() {
      try {
        setIsLoading(true)
        // Get current user
        const userData = await getUserInfo()
        const userId = userData.id

        // Get decks for current user from supabase
        const rawDecks = await decksService.getDecksByCreator(userId)

        // Transform the decks to match FlashcardDeck type
        const decksWithFlashcards = await Promise.all(
          rawDecks.map(async deck => {
            const cards = await decksService.getFlashcardsForDeck(deck.id)
            return {
              id: deck.id,
              title: deck.name,
              subject: 'General', // Default subject since it's not available from Supabase
              flashcards: cards,
              createdAt: deck.created_at,
            }
          })
        )

        setUserDecks(decksWithFlashcards)
      } catch (error) {
        console.error('Error fetching decks:', error)
        setUserDecks([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserDecksAndCounts()
  }, [refreshTrigger])

  // Add a method to trigger refresh
  const refreshDeckList = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Expose refresh method to parent component
  useEffect(() => {
    if (onCreateNew) {
      const originalOnCreateNew = onCreateNew
      onCreateNew = () => {
        originalOnCreateNew()
        refreshDeckList()
      }
    }
  }, [onCreateNew])

  const filteredDecks = userDecks.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-full min-h-0 w-full flex-col rounded-lg border border-indigo-100 bg-gradient-to-b from-white to-indigo-50/30">
      {/* header */}
      <div className="h-[120px] border-b border-indigo-100 p-4">
        <Button
          className="mb-4 w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-sm transition-all hover:from-purple-600 hover:to-indigo-700"
          size="sm"
          onClick={onCreateNew}
          disabled={disableCreateButton}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Deck
        </Button>

        <div className="relative">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-indigo-400" />
          <Input
            type="search"
            placeholder="Search decks..."
            className="rounded-md border-indigo-200 pl-8 placeholder:text-indigo-300 focus-visible:ring-indigo-400"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* scrollable list */}
      <div className="min-h-0 w-[20vw] flex-1 overflow-y-scroll p-2 px-1">
        {isLoading ? (
          <div className="p-6 text-center">
            <p className="text-indigo-600">Loading decks...</p>
          </div>
        ) : filteredDecks.length ? (
          filteredDecks.map(deck => (
            <button
              key={deck.id}
              onClick={() => handleDeckClick(deck)}
              className={cn(
                'mb-2 w-full max-w-full overflow-hidden rounded-xl p-3 text-left transition-all',
                'border hover:shadow-md',
                selectedDeckId === deck.id
                  ? 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-900 shadow-sm'
                  : 'border-transparent text-gray-700 hover:bg-indigo-50/50',
                animateDeckId === deck.id && 'animate-appear'
              )}
            >
              <div className="flex min-w-0 items-center truncate overflow-hidden text-sm font-medium">
                <div
                  className={cn(
                    'mr-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md',
                    selectedDeckId === deck.id
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                      : 'bg-gradient-to-br from-indigo-100 to-purple-200 text-indigo-700'
                  )}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                </div>
                {deck.title}
              </div>

              <div className="mt-1.5 flex justify-between pl-9 text-xs">
                <span
                  className={cn(
                    'flex items-center',
                    selectedDeckId === deck.id ? 'text-indigo-700' : 'text-indigo-400'
                  )}
                >
                  <span className="font-medium">{deck.flashcards?.length ?? 0}</span>
                  <span className="ml-1">cards</span>
                </span>

                <span
                  className={cn(
                    'flex items-center',
                    selectedDeckId === deck.id ? 'text-purple-600' : 'text-purple-400'
                  )}
                >
                  <Clock className="mr-1 h-3 w-3 flex-shrink-0" />
                  {formatDate(deck.createdAt)}
                </span>
              </div>
            </button>
          ))
        ) : (
          <div className="p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
              <BookOpen className="h-6 w-6 text-indigo-300" />
            </div>
            <p className="font-medium text-indigo-600">No decks found</p>
            <p className="mt-1 text-xs text-indigo-400">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  )
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(dateString)
  )
}
