'use client'

import { useRef, useState } from 'react'

import { Award } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { TeachingChat, TeachingChatHandle } from '@/components/teaching-chat'
import { TeachingFlashcard } from '@/components/teaching-flashcard'
import { Button } from '@/components/ui/button'
import { WebcamView } from '@/components/webcam-view'
import { evaluateChat } from '@/lib/api/flashcards'
import { useEvaluationStore } from '@/store/evaluation-store'
import { useFlashcardStore } from '@/store/flashcard-store'

export default function TeachPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)

  const activeDeck = useFlashcardStore(s => s.activeTeachingDeck)
  const setEvaluationResults = useEvaluationStore(s => s.setEvaluationResults)
  const setLoading = useEvaluationStore(s => s.setLoading)

  const router = useRouter()
  const chatRef = useRef<TeachingChatHandle>(null)

  /* ---------- audio handler ---------- */
  const handleAudioRecorded = async (blob: Blob, history: string[]) => {
    if (!activeDeck) return
    setIsProcessing(true)
    try {
      await chatRef.current?.handleAudioRecorded(blob, history)
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  /* ---------- evaluation handler ---------- */
  const handleEvaluate = async () => {
    if (!chatRef.current || !activeDeck) return

    setIsEvaluating(true)
    setLoading(true)
    try {
      const msgs = chatRef.current.getMessages()
      const formatted = msgs.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.content,
      }))
      const results = await evaluateChat(formatted)
      setEvaluationResults(results)
      router.push('/evaluate')
    } finally {
      setIsEvaluating(false)
    }
  }

  /* ---------- layout ---------- */
  return (
    <div className="flex min-h-screen flex-col">
      {/* header is 64 px in ProtectedLayout → subtract it */}
      <main className="flex h-[calc(100vh-64px)] flex-col gap-4 p-4 pb-6 md:flex-row">
        {/* left pane — 40 vw on md+ */}
        <div className="flex w-full shrink-0 flex-col space-y-4 md:w-[40vw]">
          <WebcamView onAudioRecorded={handleAudioRecorded} className="flex-1" />
          <TeachingFlashcard className="flex-1" />
        </div>

        {/* right pane — fills remaining width (≈ 60 vw − gap) */}
        <div className="flex w-[58vw] min-w-0 flex-1 flex-col">
          <TeachingChat ref={chatRef} className="flex-1" />
          <Button
            className="mt-2 w-full"
            variant="outline"
            onClick={handleEvaluate}
            disabled={isEvaluating || !activeDeck}
          >
            <Award className="mr-2 h-4 w-4" />
            {isEvaluating ? 'Evaluating...' : 'Evaluate Teaching'}
          </Button>
        </div>
      </main>
    </div>
  )
}
