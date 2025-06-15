export interface FlashcardData {
  id: string
  question: string
  answer: string
}

export interface FlashcardDeck {
  id: string
  title: string
  subject: string
  description?: string
  flashcards: FlashcardData[]
  createdAt: string
}

export const mockDecks: Record<string, FlashcardDeck> = {
  arithmetic: {
    id: 'deck-arithmetic',
    title: 'Basic Arithmetic',
    subject: 'mathematics',
    createdAt: new Date().toISOString(),
    flashcards: [
      {
        id: 'arithmetic-1',
        question: 'What is 12 × 8?',
        answer: '96',
      },
      {
        id: 'arithmetic-2',
        question: 'What is 144 ÷ 12?',
        answer: '12',
      },
      {
        id: 'arithmetic-3',
        question: 'What is 56 + 37?',
        answer: '93',
      },
      {
        id: 'arithmetic-4',
        question: 'What is 125 − 68?',
        answer: '57',
      },
      {
        id: 'arithmetic-5',
        question: 'What are the factors of 24?',
        answer: '1, 2, 3, 4, 6, 8, 12, and 24',
      },
      {
        id: 'arithmetic-6',
        question: 'What is 3² + 4²?',
        answer: '9 + 16 = 25',
      },
      {
        id: 'arithmetic-7',
        question: 'What is 0.25 as a fraction?',
        answer: '¼ or 1/4',
      },
      {
        id: 'arithmetic-8',
        question: 'What is 15% of 80?',
        answer: '12',
      },
      {
        id: 'arithmetic-9',
        question: 'What is the square root of 81?',
        answer: '9',
      },
      {
        id: 'arithmetic-10',
        question: 'What is 2.5 × 4.2?',
        answer: '10.5',
      },
    ],
  },
  biology: {
    id: 'deck-biology',
    title: 'Cell Biology',
    subject: 'science',
    createdAt: new Date().toISOString(),
    flashcards: [
      {
        id: 'biology-1',
        question: 'What is the powerhouse of the cell?',
        answer: 'Mitochondria',
      },
      {
        id: 'biology-2',
        question: 'What organelle is responsible for protein synthesis?',
        answer: 'Ribosomes',
      },
      {
        id: 'biology-3',
        question: 'What is the cell membrane made of?',
        answer: 'Phospholipid bilayer',
      },
      {
        id: 'biology-4',
        question: 'What is the process of cell division called?',
        answer: 'Mitosis (for somatic cells) and Meiosis (for gametes)',
      },
      {
        id: 'biology-5',
        question: 'What is the function of the Golgi apparatus?',
        answer: 'Processing and packaging of proteins for secretion',
      },
    ],
  },
  programming: {
    id: 'deck-programming',
    title: 'JavaScript Fundamentals',
    subject: 'computer science',
    createdAt: new Date().toISOString(),
    flashcards: [
      {
        id: 'programming-1',
        question: 'What is a closure in JavaScript?',
        answer:
          "A closure is a function that has access to its own scope, the outer function's scope, and the global scope.",
      },
      {
        id: 'programming-2',
        question: 'What is the difference between let and var?',
        answer:
          "let is block-scoped while var is function-scoped. Also, let doesn't allow redeclaration and isn't hoisted to the top.",
      },
      {
        id: 'programming-3',
        question: 'What is a Promise in JavaScript?',
        answer:
          'A Promise is an object representing the eventual completion or failure of an asynchronous operation.',
      },
      {
        id: 'programming-4',
        question: "What is the purpose of the 'this' keyword in JavaScript?",
        answer:
          "The 'this' keyword refers to the object it belongs to and has different values depending on where it is used.",
      },
      {
        id: 'programming-5',
        question: 'What is a callback function?',
        answer:
          'A callback function is a function passed into another function as an argument to be executed later.',
      },
    ],
  },
}

// Function to search through decks by subject or title
export function searchDecks(query: string): FlashcardDeck | null {
  const normalizedQuery = query.toLowerCase().trim()

  // Direct match by key
  if (mockDecks[normalizedQuery]) {
    return mockDecks[normalizedQuery]
  }

  // Search by title or subject
  for (const key in mockDecks) {
    const deck = mockDecks[key]
    if (
      deck.title.toLowerCase().includes(normalizedQuery) ||
      deck.subject.toLowerCase().includes(normalizedQuery)
    ) {
      return deck
    }
  }

  return null
}
