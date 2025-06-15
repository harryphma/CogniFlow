import { supabase } from '@/lib/supabase'
import { Deck, Flashcard } from '@/types/types'

class DecksService {
  async getAllDecks(): Promise<Deck[]> {
    const { data, error } = await supabase
      .from('deck')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async getDeckById(deckId: string): Promise<Deck> {
    const { data, error } = await supabase
      .from('deck')
      .select('*')
      .eq('id', deckId)
      .single()

    if (error) throw error
    return data
  }

  async getDecksByCreator(creatorId: string): Promise<Deck[]> {
    const { data, error } = await supabase
      .from('deck')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async getFlashcardsForDeck(deckId: string): Promise<Flashcard[]> {
    const { data, error } = await supabase
      .from('flashcard')
      .select('*')
      .eq('deck_id', deckId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  }

  async createDeck(deckData: Partial<Deck>): Promise<Deck> {
    const { data, error } = await supabase
      .from('deck')
      .insert([deckData])
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateDeck(deckId: string, deckData: Partial<Deck>): Promise<Deck> {
    const { data, error } = await supabase
      .from('deck')
      .update(deckData)
      .eq('id', deckId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteDeck(deckId: string): Promise<void> {
    const { error } = await supabase
      .from('deck')
      .delete()
      .eq('id', deckId)

    if (error) throw error
  }
}

export const decksService = new DecksService()
