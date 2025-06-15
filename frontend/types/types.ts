export type Message = {
  id: number
  created_at: string
  content: string
  role: string
  thread_id: number
}

export type MessageThread = {
  id: number
  name: string
  created_at: string
  creator_id: string
}

export type Profile = {
  id: string
  email: string
  name: string
  image_url: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export type Flashcard = {
  id: string
  created_at: string
  question: string
  answer: string
  deck_id: string
}

export type Deck = {
  id: string
  created_at: string
  name: string
  creator_id: string
}
