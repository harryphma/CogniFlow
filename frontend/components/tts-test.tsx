'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function TTSTest() {
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handlePlay = async () => {
    if (!text.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tts/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate speech')
      }

      // Create a blob from the response
      const blob = await response.blob()
      const audioUrl = URL.createObjectURL(blob)

      // Create and play audio
      const audio = new Audio(audioUrl)
      audio.play()

      // Clean up the URL after playing
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
      }
    } catch (error) {
      console.error('Error generating speech:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Text-to-Speech Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Enter text to convert to speech"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <Button onClick={handlePlay} disabled={isLoading || !text.trim()} className="w-full">
          {isLoading ? 'Generating...' : 'Play Speech'}
        </Button>
      </CardContent>
    </Card>
  )
}
