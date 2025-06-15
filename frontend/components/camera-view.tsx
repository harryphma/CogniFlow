'use client'

import { useEffect, useRef } from 'react'

import { Camera, Mic } from 'lucide-react'

import { FlashcardDeck } from '@/data/mock-flashcards'
import { cn } from '@/lib/utils'

interface CameraViewProps {
  isActive: boolean
  isRecording: boolean
  recordingReady: boolean
  videoRef: React.RefObject<HTMLVideoElement>
  positionBottomLeft?: boolean
  activeTeachingDeck?: FlashcardDeck
  className?: string
}

export function CameraView({
  isActive,
  isRecording,
  recordingReady,
  videoRef,
  positionBottomLeft = false,
  activeTeachingDeck,
  className,
}: CameraViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // When positionBottomLeft changes, animate the transition
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.transition = 'all 0.3s ease-in-out'
    }
  }, [positionBottomLeft])

  const containerClasses = cn(
    'bg-muted flex flex-col items-center justify-center rounded-md p-2',
    positionBottomLeft && isActive && 'fixed bottom-4 left-4 z-50 w-64 shadow-lg',
    className
  )

  // If camera is not active and not recording and no recording is ready, don't render anything
  if (!isActive && !isRecording && !recordingReady) {
    return null
  }

  return (
    <div ref={containerRef} className={containerClasses}>
      {isActive ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          {isRecording && (
            <div className="absolute top-2 right-2 flex items-center gap-2 rounded-md bg-red-500 px-2 py-1 text-xs text-white">
              <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
              Recording
            </div>
          )}
        </div>
      ) : (
        <div className="py-8">
          {isRecording ? (
            <div className="flex flex-col items-center">
              <Mic className="h-12 w-12 animate-pulse text-red-500" />
              <div className="mt-2 text-sm">Recording audio...</div>
            </div>
          ) : recordingReady ? (
            <div className="flex flex-col items-center">
              <div className="rounded-md bg-green-100 px-3 py-2 text-green-800">
                Recording ready to send
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
