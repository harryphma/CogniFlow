'use client'

import { useEffect, useRef, useState } from 'react'

import { Camera, CameraOff, Download, Mic, MicOff, Send } from 'lucide-react'

import { CameraView } from '@/components/camera-view'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FlashcardData } from '@/data/mock-flashcards'
import { useFlashcardStore } from '@/store/flashcard-store'

interface WebcamViewProps {
  onAudioRecorded?: (audioBlob: Blob, chatHistory: string[]) => Promise<void>
  className?: string
}

export function WebcamView({ onAudioRecorded, className }: WebcamViewProps) {
  const [cameraActive, setCameraActive] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingReady, setRecordingReady] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [positionBottomLeft, setPositionBottomLeft] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioBlobRef = useRef<Blob | null>(null)
  const activeTeachingDeck = useFlashcardStore(state => state.activeTeachingDeck)

  // When camera is activated, first show it in the card, then after a delay move it to bottom left
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (cameraActive) {
      // Start with camera in the card
      setPositionBottomLeft(false)

      // After a delay, move it to bottom left
      timer = setTimeout(() => {
        setPositionBottomLeft(true)
      }, 2000) // 2 second delay before moving camera
    } else {
      setPositionBottomLeft(false)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [cameraActive])

  const toggleCamera = () => {
    setCameraActive(prev => {
      // If turning off, explicitly stop tracks here as well
      if (prev && streamRef.current) {
        const tracks = streamRef.current.getTracks()
        tracks.forEach(track => {
          console.log(`Stopping track: ${track.kind} with ID: ${track.id}`)
          track.stop()
        })
        streamRef.current = null

        // Ensure video element is cleared
        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
      } else if (!prev) {
        // Enable webcam
        startWebcam()
      }
      return !prev
    })
  }

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false, // We handle audio separately for recording
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        console.log('Webcam started successfully')
      }
    } catch (err) {
      console.error('Error starting webcam:', err)
      setCameraActive(false)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const startRecording = () => {
    // Reset recording state
    setRecordingReady(false)
    audioBlobRef.current = null
    audioChunksRef.current = []

    const setupMediaRecorder = (stream: MediaStream) => {
      try {
        // Check if we have an audio track
        const audioTracks = stream.getAudioTracks()
        if (audioTracks.length === 0) {
          console.error('No audio tracks found in the stream')
          return
        }

        console.log(
          `Audio tracks available: ${audioTracks.length}`,
          audioTracks.map(t => `${t.label} (${t.enabled ? 'enabled' : 'disabled'})`)
        )

        // Use formats known to work well with most browsers
        let options = {}
        const supportedTypes = [
          'audio/webm', // Most widely supported in modern browsers
          'audio/webm;codecs=opus',
          'audio/mp4',
          'audio/wav', // Try WAV format
          'audio/x-wav',
          'audio/wave',
          '', // Empty string = browser default
        ]

        // Find the first supported MIME type
        for (const type of supportedTypes) {
          if (!type || MediaRecorder.isTypeSupported(type)) {
            if (type) {
              options = { mimeType: type }
              console.log(`Using MIME type: ${type}`)
            } else {
              console.log('Using browser default MIME type')
            }
            break
          }
        }

        // Create a new media recorder instance
        try {
          const mediaRecorder = new MediaRecorder(stream, options)
          mediaRecorderRef.current = mediaRecorder

          mediaRecorder.ondataavailable = event => {
            console.log(`Data available event: size=${event.data.size} type=${event.data.type}`)
            if (event.data && event.data.size > 0) {
              audioChunksRef.current.push(event.data)
            }
          }

          mediaRecorder.onerror = event => {
            console.error('MediaRecorder error:', event)
            setIsRecording(false)
          }

          mediaRecorder.onstop = async () => {
            console.log(`Recording stopped. Chunks: ${audioChunksRef.current.length}`)

            if (audioChunksRef.current.length === 0) {
              console.error('No audio data was captured during recording')
              return
            }

            // Use the format that was actually recorded for better playback compatibility
            const recordedType = audioChunksRef.current[0].type || 'audio/webm'
            const audioBlob = new Blob(audioChunksRef.current, { type: recordedType })

            console.log(`Audio blob created: size=${audioBlob.size} type=${audioBlob.type}`)
            audioBlobRef.current = audioBlob
            setRecordingReady(true)
          }

          // Start with a 1000ms (1s) timeslice - more reliable across browsers
          try {
            console.log('MediaRecorder state before start:', mediaRecorder.state)
            mediaRecorder.start(1000)
            console.log('MediaRecorder started successfully:', mediaRecorder.state)
            setIsRecording(true)
          } catch (startError) {
            console.error('Error starting MediaRecorder:', startError)
            // Try without timeslice as fallback
            try {
              mediaRecorder.start()
              console.log('MediaRecorder started without timeslice', mediaRecorder.state)
              setIsRecording(true)
            } catch (fallbackError) {
              console.error('Fatal error starting MediaRecorder:', fallbackError)
              setIsRecording(false)
            }
          }
        } catch (initError) {
          console.error('Error initializing MediaRecorder:', initError)
          throw initError
        }
      } catch (err) {
        console.error('Error setting up MediaRecorder:', err)
        setIsRecording(false)
      }
    }

    try {
      // If camera is active, we need an audio+video stream
      if (cameraActive && streamRef.current) {
        // Check if the existing stream has audio tracks
        const existingAudioTracks = streamRef.current.getAudioTracks()

        if (existingAudioTracks.length > 0) {
          // Stream already has audio, use it
          console.log('Using existing camera stream with audio for recording')
          setupMediaRecorder(streamRef.current)
        } else {
          // Need to get a new stream with both audio and video
          console.log('Getting new stream with both audio and video')
          navigator.mediaDevices
            .getUserMedia({
              video: true,
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
            })
            .then(newStream => {
              // Stop old video tracks
              const oldVideoTracks = streamRef.current?.getVideoTracks() || []
              oldVideoTracks.forEach(track => track.stop())

              // Update video element with new stream
              if (videoRef.current) {
                videoRef.current.srcObject = newStream
              }

              // Update stream reference
              streamRef.current = newStream
              setupMediaRecorder(newStream)
            })
            .catch(err => {
              console.error('Error getting audio+video stream:', err)
              setIsRecording(false)
            })
        }
      } else {
        // Audio only recording
        navigator.mediaDevices
          .getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          })
          .then(stream => {
            // Keep reference to the stream for cleanup
            streamRef.current = stream
            setupMediaRecorder(stream)
          })
          .catch(err => {
            console.error('Error accessing microphone:', err)
            setIsRecording(false)
          })
      }
    } catch (err) {
      console.error('Error starting recording:', err)
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Ensure we request one last chunk before stopping
      if (mediaRecorderRef.current.state === 'recording') {
        console.log('Requesting final data chunk before stopping')
        mediaRecorderRef.current.requestData()

        // Small delay to ensure data is processed before stopping
        setTimeout(() => {
          mediaRecorderRef.current?.stop()
          console.log('MediaRecorder stopped')
          setIsRecording(false)

          // Stop all tracks in the stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
          }
        }, 100)
      } else {
        console.log(
          `Cannot stop recording: MediaRecorder state is ${mediaRecorderRef.current.state}`
        )
        setIsRecording(false)
      }
    }
  }

  const sendRecording = async () => {
    if (!audioBlobRef.current || !activeTeachingDeck || !onAudioRecorded) return

    setIsSending(true)
    try {
      // Use the audio blob in whatever format it was recorded
      const audioToSend = audioBlobRef.current
      console.log(`Sending audio recording: size=${audioToSend.size} type=${audioToSend.type}`)

      // Convert flashcards to chat history format
      console.log(`Active teaching deck: ${activeTeachingDeck.flashcards}`)
      const chatHistory = activeTeachingDeck.flashcards.map((card: FlashcardData) =>
        JSON.stringify({
          role: 'system',
          content: `Question: ${card.question}\nAnswer: ${card.answer}`,
        })
      )

      await onAudioRecorded(audioToSend, chatHistory)

      // Reset recording state after successful sending
      setRecordingReady(false)
      audioBlobRef.current = null
    } catch (err) {
      console.error('Error sending recording:', err)
    } finally {
      setIsSending(false)
    }
  }

  const cancelRecording = () => {
    setRecordingReady(false)
    audioBlobRef.current = null

    // Also stop any active stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  // Function to download the audio recording for debugging
  const downloadRecording = () => {
    if (!audioBlobRef.current) return

    if (audioBlobRef.current.size === 0) {
      console.error('Cannot download: audio blob is empty')
      return
    }

    // Make sure we're using a playable format - browser's default might be more compatible
    // than forcing audio/wav which might not be properly encoded
    const actualType = audioBlobRef.current.type || 'audio/webm'
    console.log(`Downloading audio: size=${audioBlobRef.current.size} type=${actualType}`)

    // Determine appropriate file extension based on MIME type
    let extension = 'webm' // Default extension
    if (actualType.includes('wav')) {
      extension = 'wav'
    } else if (actualType.includes('mp4') || actualType.includes('mp4a')) {
      extension = 'mp4'
    } else if (actualType.includes('ogg')) {
      extension = 'ogg'
    }

    // Create a URL for the blob
    const url = URL.createObjectURL(audioBlobRef.current)

    // Create a link element
    const a = document.createElement('a')
    a.href = url
    a.download = `recording-${Date.now()}.${extension}`

    // Append to the body, click and remove
    document.body.appendChild(a)
    a.click()

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
  }

  useEffect(() => {
    // Cleanup function to ensure all tracks are stopped when the component unmounts
    return () => {
      // Stop recording if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        console.log('Component cleanup: stopping media recorder')
        mediaRecorderRef.current.stop()
      }

      // Stop all media tracks
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks()
        tracks.forEach(track => {
          console.log(`Component cleanup: Stopping track: ${track.kind} with ID: ${track.id}`)
          track.stop()
        })
        streamRef.current = null
      }

      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, []) // Empty dependency array means this only runs on unmount

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">Show your face!</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCamera}
              className={cameraActive ? 'bg-blue-50' : ''}
            >
              {cameraActive ? (
                <>
                  <CameraOff className="mr-2 h-4 w-4" />
                  Off
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  On
                </>
              )}
            </Button>

            {!recordingReady && (
              <Button
                variant={isRecording ? 'destructive' : 'secondary'}
                size="sm"
                onClick={toggleRecording}
                disabled={!activeTeachingDeck || isSending}
              >
                {isRecording ? (
                  <>
                    <MicOff className="mr-2 h-4 w-4" />
                    Stop
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Record
                  </>
                )}
              </Button>
            )}

            {recordingReady && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={cancelRecording}
                  disabled={isSending}
                >
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={sendRecording} disabled={isSending}>
                  {isSending ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CameraView
          isActive={cameraActive}
          isRecording={isRecording}
          recordingReady={recordingReady}
          videoRef={videoRef as React.RefObject<HTMLVideoElement>}
          positionBottomLeft={positionBottomLeft}
          activeTeachingDeck={activeTeachingDeck || undefined}
        />
      </CardContent>
    </Card>
  )
}
