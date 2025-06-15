'use server'

import { FlashcardData } from '@/data/mock-flashcards'
import { createClient } from '@/utils/supabase/server'

// API URL - default to localhost if not provided in env
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
interface LLMResponseResult {
  response: string
  transcribed_text: string
}

const getSession = async () => {
  const supabase = await createClient()
  const session = await supabase.auth.getSession()
  if (!session.data.session?.access_token) {
    throw new Error('No session found')
  }
  return session.data.session?.access_token
}
/**
 * Generate flashcards from a subject using the AI
 *
 * @param subject The subject to generate flashcards for
 * @returns Array of FlashcardData
 */
export async function generateFlashcards(subject: string): Promise<{cards: FlashcardData[], user_id: string}> {
  const sessionToken = await getSession();
  const formData = new FormData();
  formData.append('subject', subject.trim());

  try {
    const response = await fetch(`${API_URL}/gemini/manual`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const result = await response.json();
    //console.log('API Response:', result); 
    
    return {
      cards: processCards(result.cards),
      user_id: result.user_id
    }
  } catch (error) {
    console.error('Error generating flashcards:', error)
    throw error
  }
}

/**
 * Generate flashcards from a PDF file
 *
 * @param file The PDF file to generate flashcards from
 * @returns Array of FlashcardData
 */
export async function generateFlashcardsFromPDF(file: File): Promise<{cards: FlashcardData[], user_id: string}> {
  const formData = new FormData();
  formData.append('file', file);
  const sessionToken = await getSession();

  try {
    const response = await fetch(`${API_URL}/gemini/"auto"`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const result = await response.json();
    //console.log('API Response:', result); 
    
    return {
      cards: processCards(result.cards),
      user_id: result.user_id
    }

    
  } catch (error) {
    console.error('Error generating flashcards from PDF:', error)
    throw error
  }
}

/**
 * Edit existing flashcards using the AI
 *
 * @param userInput The user's input on how to modify the flashcards
 * @param existingCards The current flashcards to edit - should be the most recent from Zustand store
 * @returns Updated array of FlashcardData
 */
export async function editFlashcards(
  userInput: string,
  existingCards: FlashcardData[]
): Promise<FlashcardData[]> {
  const sessionToken = await getSession()
  try {
    const formData = new FormData()
    formData.append('user_input', userInput.trim())
    // Fix: Change the form field name from 'flashcards' to 'current_flashcards' to match the backend
    formData.append('current_flashcards', JSON.stringify(existingCards))

    console.log('Sending flashcards for edit:', existingCards.length)

    const response = await fetch(`${API_URL}/gemini/edit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const result = await response.json()
    const cards = result.flashcards || result

    if (!cards || !Array.isArray(cards)) {
      throw new Error('Invalid response format from server')
    }

    return processCards(cards)
  } catch (error) {
    console.error('Error editing flashcards:', error)
    throw error
  }
}

/**
 * Generate an LLM response based on audio input and chat history
 *
 * @param audioBlob The audio blob containing the user's spoken message
 * @param chatHistory The current chat history
 * @param languageCode The language code for speech recognition (default: "en-US")
 * @returns Object containing the LLM response and transcribed text
 */
export async function generateLLMResponse(
  audioBlob: Blob,
  chatHistory: string[],
  languageCode = 'en-US'
): Promise<LLMResponseResult> {
  const sessionToken = await getSession()
  const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, {
    type: audioBlob.type || 'audio/webm',
  })
  const formData = new FormData()
  formData.append('audio_file', audioFile)
  formData.append('chat_history_json', JSON.stringify(chatHistory))
  formData.append('language_code', languageCode)

  try {
    const response = await fetch(`${API_URL}/tts/generate_llm_response`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      body: formData,
    })
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    const result: LLMResponseResult = await response.json()
    const llm_text = result.response
    // Generate audio from LLM response text
    const audioResponse = await fetch(`${API_URL}/tts/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: llm_text,
        language: 'en', // Use default English for now
      }),
    })

    if (!audioResponse.ok) {
      throw new Error(`Audio API error: ${audioResponse.status}`)
    }

    // Get audio blob from response
    const audioBlob = await audioResponse.blob()

    // Create and play audio
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)
    await audio.play()

    // Cleanup URL after playing
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl)
    }
    return result
  } catch (error) {
    console.error('Error generating LLM response:', error)
    throw error
  }
}

/**
 * Evaluate a chat conversation using the API
 *
 * @param chatHistory Array of chat messages in {role, content} format
 * @returns Evaluation scores for the conversation
 */
export async function evaluateChat(chatHistory: { role: string; content: string }[]): Promise<{
  knowledge_accuracy: number
  explanation_quality: number
  intuitiveness: number
  overall_score: number
}> {
  const sessionToken = await getSession()
  try {
    const formData = new FormData()
    formData.append('chat_history_json', JSON.stringify(chatHistory))

    const response = await fetch(`${API_URL}/tts/evaluate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error evaluating chat:', error)
    throw error
  }
}

/**
 * Helper function to process cards from the API and ensure they match the FlashcardData format
 */
interface RawCardData {
  id?: string
  question?: string
  answer?: string
}

function processCards(cards: RawCardData[]): FlashcardData[] {
  return cards.map((card, index) => ({
    id: card.id || `card-${Date.now()}-${index}`,
    question: card.question || 'Question not available',
    answer: card.answer || 'Answer not available',
  }))
}
