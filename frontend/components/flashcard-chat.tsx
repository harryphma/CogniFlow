'use client'

import type React from 'react'
import { useEffect, useState, useCallback } from 'react'

import { useRouter } from 'next/navigation'
import debounce from 'lodash/debounce'

import { ChatInput } from '@/components/chat-input'
import { Button } from '@/components/ui/button'
import { FlashcardData, FlashcardDeck } from '@/data/mock-flashcards'
import { getUserInfo } from '@/lib/api/auth'
import { editFlashcards, generateFlashcards, generateFlashcardsFromPDF } from '@/lib/api/flashcards'
import { decksService, flashcardsService, messagesService } from '@/lib/services/'
import { cn } from '@/lib/utils'
import { Message, useFlashcardStore } from '@/store/flashcard-store'
import { Message as DBMessage, Deck, Flashcard, MessageThread } from '@/types/types'

interface FlashcardChatProps {
  onNewDeckCreated?: (deck: FlashcardDeck) => void
  selectedDeck?: FlashcardDeck | null
  isEditMode?: boolean
  isFullPage?: boolean
}

export function FlashcardChat({
  onNewDeckCreated,
  selectedDeck,
  isEditMode = false,
  isFullPage = false,
}: FlashcardChatProps) {
  const router = useRouter()

  // Use the Zustand store for deck-specific flashcards and messages
  const {
    setDeckFlashcards,
    getDeckFlashcards,
    addDeck,
    updateDeck,
    deckFlashcards,
    // Add message-related methods
    getDeckMessages,
    addMessageToDeck,
    setDeckMessages,
    setActiveTeachingDeck,
  } = useFlashcardStore()

  // Initialize messages state from Zustand store if a deck is selected
  const [messages, setMessages] = useState<Message[]>(() => {
    if (isEditMode && selectedDeck) {
      const storedMessages = getDeckMessages(selectedDeck.id)
      if (storedMessages.length > 0) {
        return storedMessages
      }
    }
    return [
      {
        id: '1',
        content:
          isEditMode && selectedDeck
            ? `You're now editing "${selectedDeck.title}". What would you like to modify or add to this deck?`
            : 'Welcome to the flashcard creator! What subject would you like to create flashcards for? You can also upload a PDF file to generate flashcards.',
        sender: 'ai',
        timestamp: new Date(),
      },
    ]
  })

  const [isAiResponding, setIsAiResponding] = useState(false)
  const [awaitingDeckName, setAwaitingDeckName] = useState(false)
  const [pendingFileCards, setPendingFileCards] = useState<FlashcardData[] | null>(null)
  const [pendingSubject, setPendingSubject] = useState<string | null>(null)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  // Only initialize messages when first mounting or when switching to a new deck
  const debouncedSaveMessages = useCallback(
    debounce(async (messagesToSave: Message[], deckId: string) => {
      if (!deckId) return

      try {
        const userData = await getUserInfo()
        const userId = userData.id

        // Find existing thread for this deck
        const existingThreads = await messagesService.getAllThreads()
        const existingThread = existingThreads.find(
          thread =>
            thread.name === `Teaching Session - ${selectedDeck?.title}` && thread.creator_id === userId
        )

        if (existingThread) {
          // Get existing messages from database
          const existingDbMessages = await messagesService.getMessagesByThread(existingThread.id)

          // Get only the most recent messages that aren't in the database
          const lastStoredMessage = existingDbMessages[existingDbMessages.length - 1]
          const lastStoredTime = lastStoredMessage
            ? new Date(lastStoredMessage.created_at).getTime()
            : 0

          // Filter messages that were created after the last stored message
          const newMessages = messagesToSave.filter(msg => {
            const msgTime = msg.timestamp instanceof Date ? msg.timestamp.getTime() : new Date(msg.timestamp).getTime()
            return msgTime > lastStoredTime
          })

          // Only store new messages
          for (const message of newMessages) {
            const messageData: Partial<DBMessage> = {
              content: message.content,
              role: message.sender === 'user' ? 'user' : 'ai',
              thread_id: existingThread.id,
            }
            await messagesService.createMessage(messageData)
          }
        } else if (selectedDeck) {
          // Create a new thread if one doesn't exist
          const threadData: Partial<MessageThread> = {
            name: `Teaching Session - ${selectedDeck.title}`,
            creator_id: userId,
          }
          const thread = await messagesService.createThread(threadData)

          // Store all messages for the new thread
          for (const message of messagesToSave) {
            const messageData: Partial<DBMessage> = {
              content: message.content,
              role: message.sender === 'user' ? 'user' : 'ai',
              thread_id: thread.id,
            }
            await messagesService.createMessage(messageData)
          }
        }
      } catch (error) {
        console.error('Error auto-saving messages:', error)
      }
    }, 1000),
    [selectedDeck]
  )

  // Function to update both local state and store messages
  const updateMessages = (newMessages: Message[], deckId?: string) => {
    setMessages(newMessages)

    // If in edit mode and we have a valid deck, save messages to store
    if (isEditMode && selectedDeck && deckId) {
      // Store all messages to maintain conversation history
      setDeckMessages(deckId, newMessages)
    }
  }

  const handleSendMessage = async (message: string, file: File | null = null) => {
    if (isAiResponding) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: message,
      sender: 'user',
      timestamp: new Date(),
      hasFile: !!file,
      fileName: file?.name,
    }

    const displayContent = file ? `${message ? message + ' ' : ''}[File: ${file.name}]` : message

    const userDisplayMessage: Message = {
      ...userMessage,
      content: displayContent,
    }

    const loadingMessage: Message = {
      id: `ai-loading-${Date.now()}`,
      content: isEditMode
        ? 'Updating flashcards...'
        : file
          ? 'Processing your file...'
          : awaitingDeckName
            ? 'Creating your deck...'
            : 'Generating flashcards...',
      sender: 'ai',
      timestamp: new Date(),
      isLoading: true,
    }

    // Update messages in both local state and store (if editing)
    const updatedMessages = [...messages, userDisplayMessage, loadingMessage]
    updateMessages(updatedMessages, selectedDeck?.id)

    setIsAiResponding(true)

    try {
      if (awaitingDeckName && (pendingFileCards || pendingSubject)) {
        // User is providing a name for the deck
        const deckName = message.trim()
        const finalCards = pendingFileCards

        // ... existing deck creation code ...

        if (finalCards) {
          //Format the deck for supabase
          const deck_new: Partial<Deck> = {
            name: deckName,
            creator_id: pendingUserId?.replace('auth0|', ''),
          }

          //Store deck_new to supabase
          const deck = await decksService.createDeck(deck_new)

          //Format the flashcards for supabase
          const flashcards_new: Partial<Flashcard>[] = finalCards.map(card => ({
            question: card.question,
            answer: card.answer,
            deck_id: deck.id,
          }))

          //Store flashcards_new to supabase based on the deck_id
          await flashcardsService.createMultipleFlashcards(flashcards_new)

          // Create the new deck object with the correct ID from Supabase
          const newDeck: FlashcardDeck = {
            id: deck.id,
            title: deckName,
            subject: pendingSubject || deckName,
            description: `Flashcards about ${pendingSubject || deckName}`,
            flashcards: finalCards,
            createdAt: deck.created_at,
          }

          // Store the deck and its flashcards in Zustand
          addDeck(newDeck)

          // Also call the onNewDeckCreated prop if provided (for compatibility)
          if (onNewDeckCreated) {
            onNewDeckCreated(newDeck)
          }

          const filteredMessages = updatedMessages.filter(msg => !msg.isLoading)
          const responseMessage = {
            id: `ai-${Date.now()}`,
            content: `I've created your "${deckName}" deck with ${finalCards.length} flashcards. You can now start studying!`,
            sender: 'ai' as const,
            timestamp: new Date(),
          }

          const finalMessages = [...filteredMessages, responseMessage]
          updateMessages(finalMessages, deck.id)
        }

        // Reset states
        setAwaitingDeckName(false)
        setPendingFileCards(null)
        setPendingSubject(null)
      } else if (file) {
        // ... existing file handling code ...
        try {
          const response = await generateFlashcardsFromPDF(file)
          const cards = response.cards
          const userId = response.user_id

          // Process cards to ensure they match FlashcardData format
          const processedCards = cards.map(
            (card: { id?: string; question?: string; answer?: string }, index: number) => ({
              id: card.id || `card-${Date.now()}-${index}`,
              question: card.question || 'Question not available',
              answer: card.answer || 'Answer not available',
            })
          )

          // Store the generated cards and ask for deck name
          setPendingFileCards(processedCards)
          setAwaitingDeckName(true)
          setPendingUserId(userId)
          // Remove loading message and add response
          const filteredMessages = updatedMessages.filter(msg => !msg.isLoading)
          const responseMessage = {
            id: `ai-${Date.now()}`,
            content: `Great! I've processed your file and created ${processedCards.length} flashcards. What would you like to name this deck?`,
            sender: 'ai' as const,
            timestamp: new Date(),
          }

          updateMessages([...filteredMessages, responseMessage])
        } catch (error) {
          console.error('Error processing file:', error)
          const filteredMessages = updatedMessages.filter(msg => !msg.isLoading)
          const errorMessage = {
            id: `ai-${Date.now()}`,
            content: 'Sorry, there was an error processing your file. Please try again.',
            sender: 'ai' as const,
            timestamp: new Date(),
          }

          updateMessages([...filteredMessages, errorMessage])
        }
      } else if (isEditMode && selectedDeck) {
        // In edit mode, send the current flashcards from the Zustand store for editing
        try {
          // Get the most recent flashcards for this deck from the store
          const currentCards = getDeckFlashcards(selectedDeck.id)

          // Edit the flashcards based on user input
          const updatedCards = await editFlashcards(message, currentCards)

          // Update the flashcards in the store for this specific deck
          setDeckFlashcards(selectedDeck.id, updatedCards)

          // Also update the actual deck in the store
          updateDeck(selectedDeck.id, { flashcards: updatedCards })

          // For backward compatibility with the props pattern
          if (onNewDeckCreated) {
            onNewDeckCreated({
              ...selectedDeck,
              flashcards: updatedCards,
            })
          }

          const filteredMessages = updatedMessages.filter(msg => !msg.isLoading)
          const responseMessage = {
            id: `ai-${Date.now()}`,
            content: `I've updated the "${selectedDeck.title}" deck based on your input. The deck now has ${updatedCards.length} cards.`,
            sender: 'ai' as const,
            timestamp: new Date(),
          }
          const finalMessages = [...filteredMessages, responseMessage]
          updateMessages(finalMessages, selectedDeck.id)

          debouncedSaveMessages(finalMessages, selectedDeck.id)
        } catch (error) {
          console.error('Error editing flashcards:', error)
          const filteredMessages = updatedMessages.filter(msg => !msg.isLoading)
          const errorMessage = {
            id: `ai-${Date.now()}`,
            content: 'Sorry, there was an error updating the flashcards. Please try again.',
            sender: 'ai' as const,
            timestamp: new Date(),
          }

          const finalMessages = [...filteredMessages, errorMessage]
          updateMessages(finalMessages, selectedDeck.id)

          debouncedSaveMessages(finalMessages, selectedDeck.id)
        }
      } else {
        // Generate flashcards using subject
        // ... existing subject handling code ...
        try {
          const response = await generateFlashcards(message.trim())
          const cards = response.cards
          const userId = response.user_id

          setPendingFileCards(cards)
          setAwaitingDeckName(true)
          setPendingSubject(message.trim())
          setPendingUserId(userId)
          const filteredMessages = updatedMessages.filter(msg => !msg.isLoading)
          const responseMessage = {
            id: `ai-${Date.now()}`,
            content: `I can create ${cards.length} flashcards for the subject "${message}". What would you like to name this deck?`,
            sender: 'ai' as const,
            timestamp: new Date(),
          }

          updateMessages([...filteredMessages, responseMessage])
        } catch (error) {
          console.error('Error fetching flashcards:', error)
          const filteredMessages = updatedMessages.filter(msg => !msg.isLoading)
          const errorMessage = {
            id: `ai-${Date.now()}`,
            content: 'Sorry, there was an error processing your request. Please try again.',
            sender: 'ai' as const,
            timestamp: new Date(),
          }

          updateMessages([...filteredMessages, errorMessage])
        }
      }
    } catch (error) {
      console.error('Error processing request:', error)
      const filteredMessages = updatedMessages.filter(msg => !msg.isLoading)
      const errorMessage = {
        id: `ai-${Date.now()}`,
        content: 'Sorry, there was an error processing your request. Please try again.',
        sender: 'ai' as const,
        timestamp: new Date(),
      }

      updateMessages([...filteredMessages, errorMessage], selectedDeck?.id)
    } finally {
      setIsAiResponding(false)
    }
  }

  const handleTeach = async () => {
    if (!selectedDeck) return

    try {
      const userData = await getUserInfo()
      const userId = userData.id

      // Get the latest flashcards from the store
      const flashcardsToUse = getDeckFlashcards(selectedDeck.id)

      // Get the latest messages from the store
      const messagesToStore = getDeckMessages(selectedDeck.id)

      // First, try to find an existing thread for this deck
      const existingThreads = await messagesService.getAllThreads()
      const existingThread = existingThreads.find(
        thread =>
          thread.name === `Teaching Session - ${selectedDeck.title}` && thread.creator_id === userId
      )

      let thread
      if (existingThread) {
        console.log('Using existing thread:', existingThread)
        thread = existingThread

        const existingDbMessages = await messagesService.getMessagesByThread(thread.id)

        // Get only the most recent messages that aren't in the database
        const lastStoredMessage = existingDbMessages[existingDbMessages.length - 1]
        const lastStoredTime = lastStoredMessage
          ? new Date(lastStoredMessage.created_at).getTime()
          : 0

        // Filter messages that were created after the last stored message
        const newMessages = messagesToStore.filter(msg => {
          const msgTime = msg.timestamp instanceof Date ? msg.timestamp.getTime() : new Date(msg.timestamp).getTime()
          return msgTime > lastStoredTime
        })

        // Only store new messages
        for (const message of newMessages) {
          const messageData: Partial<DBMessage> = {
            content: message.content,
            role: message.sender === 'user' ? 'user' : 'ai',
            thread_id: thread.id,
          }
          console.log('Storing new message:', messageData)
          await messagesService.createMessage(messageData)
        }
      } else {
        // Create a new thread only if one doesn't exist
        const threadData: Partial<MessageThread> = {
          name: `Teaching Session - ${selectedDeck.title}`,
          creator_id: userId,
        }
        console.log('Creating new thread with data:', threadData)
        thread = await messagesService.createThread(threadData)
        console.log('New thread created:', thread)

        // Store all messages for the new thread
        for (const message of messagesToStore) {
          const messageData: Partial<DBMessage> = {
            content: message.content,
            role: message.sender === 'user' ? 'user' : 'ai',
            thread_id: thread.id,
          }
          console.log('Storing message:', messageData)
          await messagesService.createMessage(messageData)
        }
      }

      // Create a complete deck with the latest flashcards
      const deckToTeach = {
        ...selectedDeck,
        flashcards:
          flashcardsToUse && flashcardsToUse.length > 0
            ? flashcardsToUse
            : selectedDeck.flashcards || [],
      }
      console.log('Deck to teach:', deckToTeach)

      // Set as active teaching deck and navigate
      setActiveTeachingDeck(deckToTeach)
      router.push('/teach')
    } catch (error: any) {
      console.error('Error storing chat history:', error)
      console.error('Error details:', {
        message: error?.message || 'Unknown error',
        code: error?.code || 'No error code',
        details: error?.details || 'No details',
        stack: error?.stack || 'No stack trace',
      })

      // Still proceed with teaching even if storing fails
      const deckToTeach = {
        ...selectedDeck,
        flashcards: getDeckFlashcards(selectedDeck.id) || selectedDeck.flashcards || [],
      }
      setActiveTeachingDeck(deckToTeach)
      router.push('/teach')
    }
  }

  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-lg border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/20',
        isFullPage && 'mx-auto max-w-4xl'
      )}
    >
      <div className="flex items-center justify-between border-b border-indigo-100 bg-white p-4">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-indigo-900">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-r from-purple-500 to-indigo-600">
              <span className="text-xs text-white">AI</span>
            </div>
            {isEditMode ? 'Flashcard Editor' : 'Flashcard Creator'}
          </h2>
          <p className="mt-1 text-sm text-indigo-600">
            {isEditMode
              ? 'Chat with AI to edit and improve your flashcards'
              : awaitingDeckName
                ? 'Please provide a name for your flashcard deck'
                : 'Chat with AI to create new flashcard decks or upload a PDF'}
          </p>
        </div>

        {/* Teach button properly positioned in the header */}
        {selectedDeck &&
          ((selectedDeck.flashcards && selectedDeck.flashcards.length > 0) ||
            (getDeckFlashcards(selectedDeck.id) &&
              getDeckFlashcards(selectedDeck.id).length > 0)) && (
            <Button
              onClick={handleTeach}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
            >
              Teach with these cards
            </Button>
          )}
      </div>

      <div
        className={cn(
          'min-h-0 flex-1 overflow-y-auto p-4',
          isFullPage ? 'max-h-[70vh]' : 'max-h-[calc(100vh-260px)]'
        )}
      >
        {isLoadingMessages && (
          <div className="flex h-full items-center justify-center">
            <div className="animate-pulse-dot1 h-2 w-2 rounded-full bg-current"></div>
            <div className="animate-pulse-dot2 h-2 w-2 rounded-full bg-current"></div>
            <div className="animate-pulse-dot3 h-2 w-2 rounded-full bg-current"></div>
          </div>
        )}
        <div className="space-y-4 pb-1">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.sender === 'user' ? 'justify-end' : 'justify-start',
                index === messages.length - 1 && !message.isLoading && 'animate-appear'
              )}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl p-4 shadow-sm',
                  message.sender === 'user'
                    ? 'rounded-br-none bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                    : 'rounded-bl-none border border-indigo-100 bg-gradient-to-r from-white to-indigo-50 text-gray-700'
                )}
              >
                {message.isLoading ? (
                  <div className="flex items-center space-x-2 py-1">
                    <div className="animate-pulse-dot1 h-2 w-2 rounded-full bg-current"></div>
                    <div className="animate-pulse-dot2 h-2 w-2 rounded-full bg-current"></div>
                    <div className="animate-pulse-dot3 h-2 w-2 rounded-full bg-current"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <div className="mt-2 flex items-center justify-between text-xs opacity-70">
                      <span>{formatTime(message.timestamp)}</span>
                      {message.hasFile && (
                        <span className="ml-2 flex items-center rounded bg-white/20 px-1.5 py-0.5 text-[10px]">
                          PDF
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 mt-auto border-t border-indigo-100 bg-gradient-to-b from-white to-indigo-50/30 p-4">
        <ChatInput
          onSendMessage={handleSendMessage}
          isDisabled={isAiResponding}
          placeholder={
            isEditMode
              ? 'Type what you want to modify or add to this deck...'
              : awaitingDeckName
                ? 'Enter a name for your flashcard deck...'
                : 'Type a subject or upload a PDF file...'
          }
          minHeight={isFullPage ? '120px' : '80px'}
        />
      </div>
    </div>
  )
}

function formatTime(date: Date | string): string {
  const dateObject = typeof date === 'string' ? new Date(date) : date

  // Check if date is valid before formatting
  if (isNaN(dateObject.getTime())) {
    return 'Invalid date'
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
  }).format(dateObject)
}



//PHAN CACH
