import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { FlashcardData, FlashcardDeck } from '@/data/mock-flashcards'
import { editFlashcards, generateFlashcards, generateFlashcardsFromPDF } from '@/lib/api/flashcards'

// Define Message type for chat messages
export type Message = {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
  isLoading?: boolean
  hasFile?: boolean
  fileName?: string
}

interface FlashcardState {
  decks: FlashcardDeck[]
  activeDeckId: string | null
  activeTeachingDeck: FlashcardDeck | null
  isLoading: boolean
  error: string | null
  deckFlashcards: Record<string, FlashcardData[]> // Track flashcards for each deck by ID

  // Track chat messages by deck ID
  deckMessages: Record<string, Message[]>

  // Actions
  setDecks: (decks: FlashcardDeck[]) => void
  addDeck: (deck: FlashcardDeck) => void
  updateDeck: (deckId: string, updatedDeck: Partial<FlashcardDeck>) => void
  removeDeck: (deckId: string) => void
  setActiveDeckId: (deckId: string | null) => void

  // Flashcard actions
  addCardToDeck: (deckId: string, card: FlashcardData) => void
  updateCardInDeck: (deckId: string, cardId: string, updatedCard: Partial<FlashcardData>) => void
  removeCardFromDeck: (deckId: string, cardId: string) => void

  // New flashcard tracking actions
  setDeckFlashcards: (deckId: string, flashcards: FlashcardData[]) => void
  getDeckFlashcards: (deckId: string) => FlashcardData[]

  // Chat message actions
  getDeckMessages: (deckId: string) => Message[]
  addMessageToDeck: (deckId: string, message: Message) => void
  setDeckMessages: (deckId: string, messages: Message[]) => void

  // Teaching context actions
  setActiveTeachingDeck: (deck: FlashcardDeck | null) => void
  clearActiveTeachingDeck: () => void

  // API-related actions
  generateFlashcardDeck: (subject: string, title?: string) => Promise<string | null>
  generateFlashcardsFromPDF: (file: File, title?: string) => Promise<string | null>
  editFlashcardsInDeck: (deckId: string, userInput: string) => Promise<void>

  // Helper methods
  getActiveDeck: () => FlashcardDeck | null
  getFlashcardsFromActiveDeck: () => FlashcardData[]
  getDeck: (deckId: string) => FlashcardDeck | null
}

export const useFlashcardStore = create<FlashcardState>()(
  persist(
    (set, get) => ({
      decks: [],
      activeDeckId: null,
      activeTeachingDeck: null, // Initialize as null
      isLoading: false,
      error: null,
      deckFlashcards: {}, // Initialize empty record
      deckMessages: {}, // Initialize empty record for chat messages

      // Actions
      setDecks: decks => set({ decks }),

      addDeck: deck =>
        set(state => {
          // Add deck and also store its flashcards in deckFlashcards
          const updatedDeckFlashcards = {
            ...state.deckFlashcards,
            [deck.id]: deck.flashcards,
          }

          // Initialize empty messages array for this deck
          const updatedDeckMessages = {
            ...state.deckMessages,
            [deck.id]: state.deckMessages[deck.id] || [
              {
                id: `welcome-${deck.id}`,
                content: `You're now editing "${deck.title}". What would you like to modify or add to this deck?`,
                sender: 'ai',
                timestamp: new Date(),
              },
            ],
          }

          return {
            decks: [...state.decks, deck],
            deckFlashcards: updatedDeckFlashcards,
            deckMessages: updatedDeckMessages,
          }
        }),

      updateDeck: (deckId, updatedDeck) =>
        set(state => {
          const updatedDecks = state.decks.map(deck =>
            deck.id === deckId ? { ...deck, ...updatedDeck } : deck
          )

          // If flashcards are updated, also update them in deckFlashcards
          const updatedDeckFlashcards = { ...state.deckFlashcards }
          if (updatedDeck.flashcards) {
            updatedDeckFlashcards[deckId] = updatedDeck.flashcards
          }

          return {
            decks: updatedDecks,
            deckFlashcards: updatedDeckFlashcards,
          }
        }),

      removeDeck: deckId =>
        set(state => {
          // Remove deck and its flashcards and messages
          const { [deckId]: _, ...remainingDeckFlashcards } = state.deckFlashcards
          const { [deckId]: __, ...remainingDeckMessages } = state.deckMessages

          return {
            decks: state.decks.filter(deck => deck.id !== deckId),
            activeDeckId: state.activeDeckId === deckId ? null : state.activeDeckId,
            deckFlashcards: remainingDeckFlashcards,
            deckMessages: remainingDeckMessages,
          }
        }),

      setActiveDeckId: deckId => set({ activeDeckId: deckId }),

      // New flashcard tracking methods
      setDeckFlashcards: (deckId, flashcards) =>
        set(state => ({
          deckFlashcards: {
            ...state.deckFlashcards,
            [deckId]: flashcards,
          },
        })),

      getDeckFlashcards: deckId => {
        return get().deckFlashcards[deckId] || []
      },

      // Chat message methods
      getDeckMessages: deckId => {
        return get().deckMessages[deckId] || []
      },

      addMessageToDeck: (deckId, message) =>
        set(state => {
          const currentMessages = state.deckMessages[deckId] || []
          return {
            deckMessages: {
              ...state.deckMessages,
              [deckId]: [...currentMessages, message],
            },
          }
        }),

      setDeckMessages: (deckId, messages) =>
        set(state => ({
          deckMessages: {
            ...state.deckMessages,
            [deckId]: messages,
          },
        })),

      // Flashcard actions
      addCardToDeck: (deckId, card) =>
        set(state => {
          const updatedDecks = state.decks.map(deck =>
            deck.id === deckId ? { ...deck, flashcards: [...deck.flashcards, card] } : deck
          )

          // Also update in deckFlashcards
          const currentCards = state.deckFlashcards[deckId] || []
          const updatedCards = [...currentCards, card]

          return {
            decks: updatedDecks,
            deckFlashcards: {
              ...state.deckFlashcards,
              [deckId]: updatedCards,
            },
          }
        }),

      updateCardInDeck: (deckId, cardId, updatedCard) =>
        set(state => {
          const updatedDecks = state.decks.map(deck =>
            deck.id === deckId
              ? {
                  ...deck,
                  flashcards: deck.flashcards.map(card =>
                    card.id === cardId ? { ...card, ...updatedCard } : card
                  ),
                }
              : deck
          )

          // Also update in deckFlashcards
          const currentCards = state.deckFlashcards[deckId] || []
          const updatedCards = currentCards.map(card =>
            card.id === cardId ? { ...card, ...updatedCard } : card
          )

          return {
            decks: updatedDecks,
            deckFlashcards: {
              ...state.deckFlashcards,
              [deckId]: updatedCards,
            },
          }
        }),

      removeCardFromDeck: (deckId, cardId) =>
        set(state => {
          const updatedDecks = state.decks.map(deck =>
            deck.id === deckId
              ? {
                  ...deck,
                  flashcards: deck.flashcards.filter(card => card.id !== cardId),
                }
              : deck
          )

          // Also update in deckFlashcards
          const currentCards = state.deckFlashcards[deckId] || []
          const updatedCards = currentCards.filter(card => card.id !== cardId)

          return {
            decks: updatedDecks,
            deckFlashcards: {
              ...state.deckFlashcards,
              [deckId]: updatedCards,
            },
          }
        }),

      // API-related actions
      generateFlashcardDeck: async (subject, title) => {
        set({ isLoading: true, error: null })
        try {
          const cards = await generateFlashcards(subject)
          const deckId = `deck-${Date.now()}`
          const newDeck: FlashcardDeck = {
            id: deckId,
            title: title || `${subject}`,
            description: `Flashcards about ${subject}`,
            flashcards: cards,
            createdAt: new Date().toISOString(),
            subject: subject,
          }

          get().addDeck(newDeck)
          set({
            activeDeckId: deckId,
            deckFlashcards: {
              ...get().deckFlashcards,
              [deckId]: cards,
            },
          })

          return deckId
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to generate flashcards'
          set({ error: errorMessage })
          return null
        } finally {
          set({ isLoading: false })
        }
      },

      generateFlashcardsFromPDF: async (file, title) => {
        set({ isLoading: true, error: null })
        try {
          const cards = await generateFlashcardsFromPDF(file)
          const deckId = `deck-${Date.now()}`
          const newDeck: FlashcardDeck = {
            id: deckId,
            title: title || `${file.name.split('.')[0]}`,
            description: `Flashcards generated from ${file.name}`,
            flashcards: cards,
            createdAt: new Date().toISOString(),
            subject: file.name.split('.')[0],
          }

          get().addDeck(newDeck)
          set({
            activeDeckId: deckId,
            deckFlashcards: {
              ...get().deckFlashcards,
              [deckId]: cards,
            },
          })

          return deckId
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to generate flashcards from PDF'
          set({ error: errorMessage })
          return null
        } finally {
          set({ isLoading: false })
        }
      },

      editFlashcardsInDeck: async (deckId, userInput) => {
        set({ isLoading: true, error: null })
        try {
          // Use the most recent flashcards from deckFlashcards
          const currentFlashcards = get().getDeckFlashcards(deckId)

          if (!currentFlashcards || currentFlashcards.length === 0) {
            // If no flashcards in our storage, fall back to deck's flashcards
            const deck = get().getDeck(deckId)
            if (!deck) {
              throw new Error('Deck not found')
            }

            const updatedCards = await editFlashcards(userInput, deck.flashcards)
            get().setDeckFlashcards(deckId, updatedCards)
            get().updateDeck(deckId, { flashcards: updatedCards })
          } else {
            // Use the stored flashcards
            const updatedCards = await editFlashcards(userInput, currentFlashcards)
            get().setDeckFlashcards(deckId, updatedCards)
            get().updateDeck(deckId, { flashcards: updatedCards })
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to edit flashcards'
          set({ error: errorMessage })
        } finally {
          set({ isLoading: false })
        }
      },

      // Teaching context actions implementation
      setActiveTeachingDeck: deck =>
        set({
          activeTeachingDeck: deck,
        }),

      clearActiveTeachingDeck: () =>
        set({
          activeTeachingDeck: null,
        }),

      // Helper methods to get the active teaching deck flashcards
      getActiveTeachingFlashcards: () => {
        const activeTeachingDeck = get().activeTeachingDeck

        if (!activeTeachingDeck) return []

        // First try to get flashcards from the deckFlashcards record
        const deckId = activeTeachingDeck.id
        const storedFlashcards = get().deckFlashcards[deckId]

        if (storedFlashcards && storedFlashcards.length > 0) {
          return storedFlashcards
        }

        // Fall back to the deck's flashcards if available
        return activeTeachingDeck.flashcards || []
      },

      // Helper methods
      getActiveDeck: () => {
        const { decks, activeDeckId } = get()
        if (!activeDeckId) return null
        return decks.find(deck => deck.id === activeDeckId) || null
      },

      getFlashcardsFromActiveDeck: () => {
        const { activeDeckId, deckFlashcards } = get()

        if (!activeDeckId) return []

        // Prefer stored flashcards if available
        const storedFlashcards = deckFlashcards[activeDeckId]
        if (storedFlashcards && storedFlashcards.length > 0) {
          return storedFlashcards
        }

        // Fall back to deck.flashcards if stored ones aren't available
        const activeDeck = get().getActiveDeck()
        return activeDeck ? activeDeck.flashcards : []
      },

      getDeck: deckId => {
        return get().decks.find(deck => deck.id === deckId) || null
      },
    }),
    { name: 'flashcard-store' }
  )
)
