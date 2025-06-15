import { supabase } from '@/lib/supabase'
import { Flashcard } from '@/types/types'

class FlashcardsService {
  async getAllFlashcards(): Promise<Flashcard[]> {
    const { data, error } = await supabase
      .from('flashcard')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  }

  async getFlashcardById(flashcardId: string): Promise<Flashcard> {
    const { data, error } = await supabase
      .from('flashcard')
      .select('*')
      .eq('id', flashcardId)
      .single()

    if (error) throw error
    return data
  }

  async getFlashcardsByDeck(deckId: string): Promise<Flashcard[]> {
    const { data, error } = await supabase
      .from('flashcard')
      .select('*')
      .eq('deck_id', deckId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  }

  async createFlashcard(flashcardData: Partial<Flashcard>): Promise<Flashcard> {
    const { data, error } = await supabase
      .from('flashcard')
      .insert([flashcardData])
      .select()
      .single()

    if (error) throw error
    return data
  }

  async createMultipleFlashcards(flashcards: Partial<Flashcard>[]): Promise<Flashcard[]> {
    const { data, error } = await supabase
      .from('flashcard')
      .insert(flashcards)
      .select()

    if (error) throw error
    return data
  }

  async updateFlashcard(
    flashcardId: string,
    flashcardData: Partial<Flashcard>
  ): Promise<Flashcard> {
    const { data, error } = await supabase
      .from('flashcard')
      .update(flashcardData)
      .eq('id', flashcardId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteFlashcard(flashcardId: string): Promise<void> {
    const { error } = await supabase.from('flashcard').delete().eq('id', flashcardId)

    if (error) throw error
  }

  async deleteFlashcardsByDeck(deckId: string): Promise<void> {
    const { error } = await supabase
      .from('flashcard')
      .delete()
      .eq('deck_id', deckId)

    if (error) throw error
  }
}

export const flashcardsService = new FlashcardsService()
