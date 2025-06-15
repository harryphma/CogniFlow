'use client'

import { useEffect, useState } from 'react'

import { motion } from 'framer-motion'
import { Award, BookOpen, Brain, Lightbulb } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useEvaluationStore } from '@/store/evaluation-store'

export default function EvaluatePage() {
  const { evaluationResults } = useEvaluationStore()
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState(evaluationResults)

  useEffect(() => {
    if (evaluationResults) {
      setScores(evaluationResults)
      setLoading(false)
    } else {
      // Fallback to default scores if no evaluation results
      setDefaultScores()
    }
  }, [evaluationResults])

  // Helper function to set default scores for demo purposes
  const setDefaultScores = () => {
    setTimeout(() => {
      setScores({
        knowledge_accuracy: 10,
        explanation_quality: 9,
        intuitiveness: 9,
        overall_score: 9,
      })
      setLoading(false)
    }, 1000)
  }

  const scoreCategories = [
    {
      name: 'Knowledge Accuracy',
      value: scores?.knowledge_accuracy || 0,
      icon: <BookOpen className="h-5 w-5 text-blue-500" />,
      description: 'How accurately you recalled and presented the information',
    },
    {
      name: 'Explanation Quality',
      value: scores?.explanation_quality || 0,
      icon: <Brain className="h-5 w-5 text-purple-500" />,
      description: 'How clear and comprehensive your explanations were',
    },
    {
      name: 'Intuitiveness',
      value: scores?.intuitiveness || 0,
      icon: <Lightbulb className="h-5 w-5 text-yellow-500" />,
      description: 'How well you connected concepts to intuitive understanding',
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <h1 className="mb-8 text-center text-3xl font-bold">Your Learning Evaluation</h1>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="border-primary h-12 w-12 animate-spin rounded-full border-t-2 border-b-2"></div>
            </div>
          ) : (
            <>
              {/* Overall Score Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <Award className="text-primary h-16 w-16" />
                      <CardTitle className="text-2xl">Overall Score</CardTitle>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                        className="bg-primary text-primary-foreground flex h-32 w-32 items-center justify-center rounded-full"
                      >
                        <span className="text-5xl font-bold">{scores?.overall_score}/10</span>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Individual Score Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {scoreCategories.map((category, index) => (
                  <motion.div
                    key={category.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
                    className="h-full"
                  >
                    <Card className="flex h-full flex-col">
                      <CardHeader className="flex-shrink-0">
                        <div className="flex items-center gap-2">
                          {category.icon}
                          <CardTitle>{category.name}</CardTitle>
                        </div>
                        <CardDescription>{category.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-grow flex-col justify-end">
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground text-sm">Score</span>
                            <span className="font-medium">{category.value}/10</span>
                          </div>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{
                              delay: 0.5 + 0.1 * index,
                              duration: 0.8,
                              ease: 'easeOut',
                            }}
                          >
                            <Progress value={category.value * 10} className="h-3" />
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
