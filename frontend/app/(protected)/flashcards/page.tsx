'use client'

import { useEffect, useState } from 'react'

import { FlashcardChat } from '@/components/flashcard-chat'
import { FlashcardDeckList } from '@/components/flashcard-deck-list'
import { FlashcardViewer } from '@/components/flashcard-viewer'
import { Button } from '@/components/ui/button'
import { FlashcardDeck } from '@/data/mock-flashcards'
import { decksService } from '@/lib/services'

export default function FlashcardsPage() {
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null)
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null)
  const [deckListKey, setDeckListKey] = useState(0)

  // Fetch deck details when activeDeckId changes
  useEffect(() => {
    async function fetchDeckDetails() {
      if (!activeDeckId) {
        setSelectedDeck(null)
        return
      }

      try {
        const deck = await decksService.getDeckById(activeDeckId)
        const cards = await decksService.getFlashcardsForDeck(activeDeckId)

        // Transform to FlashcardDeck format
        setSelectedDeck({
          id: deck.id,
          title: deck.name,
          subject: 'General',
          flashcards: cards,
          createdAt: deck.created_at,
        })
      } catch (error) {
        console.error('Error fetching deck details:', error)
        setSelectedDeck(null)
      }
    }

    fetchDeckDetails()
  }, [activeDeckId])

  /* ---------- handlers ---------- */
  const handleDeckSelect = (deck: FlashcardDeck) => {
    setActiveDeckId(deck.id)
    setIsCreateMode(false)
  }

  const handleNewDeckCreated = (deck: FlashcardDeck) => {
    setActiveDeckId(deck.id)
    setIsCreateMode(false)
    setDeckListKey(prev => prev + 1) // Force deck list to refresh
  }

  const handleCreateNew = () => {
    setIsCreateMode(true)
  }

  /* ---------- render ---------- */
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 divide-x md:grid-cols-10">
      {/* -------- deck list column -------- */}
      <div className="flex min-h-0 min-w-0 flex-col border-r md:col-span-2">
        <FlashcardDeckList
          key={deckListKey}
          onDeckSelect={handleDeckSelect}
          onCreateNew={handleCreateNew}
          disableCreateButton={isCreateMode}
          selectedDeckId={activeDeckId}
        />
      </div>

      {/* -------- create-new mode -------- */}
      {isCreateMode ? (
        <div className="flex min-w-0 flex-col p-4 md:col-span-8">
          <div className="mb-4 flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-bold">Create New Flashcard Deck</h2>
            <Button variant="outline" onClick={() => setIsCreateMode(false)}>
              Cancel
            </Button>
          </div>
          <div className="min-h-0 flex-1">
            <FlashcardChat onNewDeckCreated={handleNewDeckCreated} isFullPage />
          </div>
        </div>
      ) : (
        <>
          {/* -------- viewer -------- */}
          <div className="flex min-w-0 items-center justify-center p-4 md:col-span-5">
            <FlashcardViewer title={selectedDeck?.title} deckId={activeDeckId || undefined} />
          </div>

          {/* -------- chat -------- */}
          <div className="min-w-0 border-l md:col-span-3">
            {selectedDeck && (
              <FlashcardChat
                selectedDeck={selectedDeck}
                onNewDeckCreated={handleNewDeckCreated}
                isEditMode
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
