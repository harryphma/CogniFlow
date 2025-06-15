'use client'

import type React from 'react'
import { useEffect, useRef, useState } from 'react'

import { FileText, Paperclip, Send, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSendMessage: (message: string, file?: File | null) => void
  isDisabled?: boolean
  placeholder?: string
  minHeight?: string
}

export function ChatInput({
  onSendMessage,
  isDisabled = false,
  placeholder = 'Ask anything or describe what you want to learn...',
  minHeight = '60px',
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea on input change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`
    }
  }, [input])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((input.trim() || selectedFile) && !isDisabled) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 500)

      onSendMessage(input, selectedFile)
      setInput('')
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleOpenFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf"
      />

      {selectedFile && (
        <div className="flex items-center justify-between rounded-t-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3">
          <div className="flex max-w-[80%] items-center gap-2 truncate">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
              <FileText className="h-4 w-4 text-indigo-600" />
            </div>
            <span className="truncate text-sm font-medium text-indigo-700">
              {selectedFile.name}
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 rounded-full p-0 transition-colors hover:bg-red-50 hover:text-red-500"
            onClick={handleRemoveFile}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove file</span>
          </Button>
        </div>
      )}

      <div
        className={cn(
          'relative overflow-hidden rounded-xl',
          selectedFile ? 'rounded-t-none border-t-0' : '',
          'border border-indigo-100 bg-white shadow-sm transition-all focus-within:border-indigo-300 focus-within:ring-1 focus-within:ring-indigo-300'
        )}
      >
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={placeholder}
          className={cn(
            `min-h-[${minHeight}] resize-none border-none py-4 pr-24 placeholder:text-indigo-300 focus-visible:ring-0`
          )}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          disabled={isDisabled}
        />
        <div className="absolute right-3 bottom-3 flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full border border-indigo-100 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
            aria-label="Attach file"
            onClick={handleOpenFileDialog}
            disabled={isDisabled}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            type="submit"
            size="icon"
            className={cn(
              'h-9 w-9 rounded-full transition-all',
              'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700',
              'shadow-sm hover:shadow',
              !(input.trim() || selectedFile) || isDisabled ? 'cursor-not-allowed opacity-50' : '',
              isAnimating && 'scale-90'
            )}
            disabled={!(input.trim() || selectedFile) || isDisabled}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  )
}
