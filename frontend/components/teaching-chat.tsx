'use client'

import type React from 'react'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

import { Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { generateLLMResponse } from '@/lib/api/flashcards'
import { cn } from '@/lib/utils'
import { useFlashcardStore } from '@/store/flashcard-store'

type Message = {
  id: string
  content: string
  sender: 'user' | 'ai'
  isLoading?: boolean
}

export interface TeachingChatHandle {
  handleAudioRecorded: (audioBlob: Blob, chatHistory: string[]) => Promise<void>
  getMessages: () => Message[]
}

export const TeachingChat = forwardRef<TeachingChatHandle, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => {
    const [messages, setMessages] = useState<Message[]>([
      {
        id: 'welcome',
        content:
          "Welcome to the teaching interface! Explain concepts as if you're teaching someone, and I'll provide feedback on your explanations.",
        sender: 'ai',
      },
    ])
    const [input, setInput] = useState('')
    const [isAiResponding, setIsAiResponding] = useState(false)
    const activeTeachingDeck = useFlashcardStore(state => state.activeTeachingDeck)

    // Function to handle audio recorded from WebcamView
    const handleAudioRecorded = async (audioBlob: Blob, chatHistory: string[]) => {
      try {
        // Add a loading message
        const loadingMessage: Message = {
          id: `ai-loading-${Date.now()}`,
          content: 'Processing your teaching...',
          sender: 'ai',
          isLoading: true,
        }

        setMessages(prev => [...prev, loadingMessage])
        setIsAiResponding(true)

        // Call API to generate response based on audio
        const result = await generateLLMResponse(audioBlob, chatHistory)

        // Add the transcription as a user message
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          content: result.transcribed_text,
          sender: 'user',
        }

        // Add the AI response
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          content: result.response,
          sender: 'ai',
        }

        // Remove loading message and add user and AI messages
        setMessages(prev => {
          const filteredMessages = prev.filter(msg => !msg.isLoading)
          return [...filteredMessages, userMessage, aiMessage]
        })
      } catch (error) {
        console.error('Error processing audio:', error)

        // Remove loading message and add error message
        setMessages(prev => {
          const filteredMessages = prev.filter(msg => !msg.isLoading)
          return [
            ...filteredMessages,
            {
              id: `error-${Date.now()}`,
              content: 'Sorry, there was an error processing your teaching. Please try again.',
              sender: 'ai',
            },
          ]
        })
      } finally {
        setIsAiResponding(false)
      }
    }

    // Expose the handleAudioRecorded method via ref
    useImperativeHandle(ref, () => ({
      handleAudioRecorded,
      getMessages: () => messages,
    }))

    const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim() || isAiResponding) return

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        content: input,
        sender: 'user',
      }

      const loadingMessage: Message = {
        id: `ai-loading-${Date.now()}`,
        content: 'Thinking...',
        sender: 'ai',
        isLoading: true,
      }

      setMessages([...messages, userMessage, loadingMessage])
      setInput('')
      setIsAiResponding(true)

      // Simulate AI response
      setTimeout(() => {
        const aiResponse =
          "I noticed you're explaining this concept clearly. Great job! You might want to consider adding a few more examples to illustrate the practical applications of this idea."

        // Remove loading message and add real response
        setMessages(prev => {
          const filteredMessages = prev.filter(msg => !msg.isLoading)
          return [
            ...filteredMessages,
            {
              id: `ai-${Date.now()}`,
              content: aiResponse,
              sender: 'ai',
            },
          ]
        })

        setIsAiResponding(false)
      }, 1500)
    }

    return (
      <div className="flex h-[85vh] flex-col overflow-hidden rounded-lg border">
        <div className="bg-card border-b p-4">
          <h2 className="font-semibold">Teaching Conversation</h2>
          <p className="text-muted-foreground text-sm">
            Explain concepts clearly and get feedback on your teaching
          </p>
          {activeTeachingDeck && (
            <p className="mt-1 text-xs text-green-600">Teaching deck: {activeTeachingDeck.title}</p>
          )}
          {!activeTeachingDeck && (
            <p className="mt-1 text-xs text-yellow-500">
              Select a teaching deck to enable voice recording
            </p>
          )}
        </div>

        <ScrollArea className="max-h-[64vh] flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={cn('flex', message.sender === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg p-3',
                    message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}
                >
                  {message.isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-current"></div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="bg-card mt-auto border-t p-4">
          <form onSubmit={handleSendMessage} className="relative">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Explain a concept or ask for feedback..."
              className="min-h-[80px] resize-none pr-12"
              disabled={isAiResponding}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(e)
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 bottom-2 rounded-full"
              disabled={!input.trim() || isAiResponding}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </div>
      </div>
    )
  }
)

TeachingChat.displayName = 'TeachingChat'
