import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Define the evaluation score interface
export interface EvaluationScore {
  knowledge_accuracy: number
  explanation_quality: number
  intuitiveness: number
  overall_score: number
}

interface EvaluationState {
  // State
  evaluationResults: EvaluationScore | null
  isLoading: boolean
  error: string | null

  // Actions
  setEvaluationResults: (results: EvaluationScore | null) => void
  clearEvaluationResults: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useEvaluationStore = create<EvaluationState>()(
  persist(
    set => ({
      // Initial state
      evaluationResults: null,
      isLoading: false,
      error: null,

      // Actions
      setEvaluationResults: results =>
        set({
          evaluationResults: results,
          isLoading: false,
        }),

      clearEvaluationResults: () => set({ evaluationResults: null }),

      setLoading: loading => set({ isLoading: loading }),

      setError: error => set({ error, isLoading: false }),
    }),
    {
      name: 'evaluation-storage',
    }
  )
)
