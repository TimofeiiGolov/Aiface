'use client'

import { useState } from 'react'
import { UploadScreen } from '@/components/upload-screen'
import { AnalyzingScreen } from '@/components/analyzing-screen'
import { ResultsScreen } from '@/components/results-screen'
import type { FaceRating } from '@/lib/face-rating'

type Stage = 'upload' | 'analyzing' | 'results'

export default function Page() {
  const [stage, setStage] = useState<Stage>('upload')
  const [image, setImage] = useState<string>('')
  const [rating, setRating] = useState<FaceRating | null>(null)
  const [error, setError] = useState<string>('')

  const analyze = async (dataUrl: string) => {
    setImage(dataUrl)
    setError('')
    setStage('analyzing')
    const startedAt = Date.now()
    // Минимальная длительность экрана сканирования, чтобы анимация точек успела выстроиться
    const MIN_SCAN_MS = 4500
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка анализа')
      }
      const elapsed = Date.now() - startedAt
      if (elapsed < MIN_SCAN_MS) {
        await new Promise((r) => setTimeout(r, MIN_SCAN_MS - elapsed))
      }
      setRating(data)
      setStage('results')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Что-то пошло не так')
      setStage('upload')
    }
  }

  const reset = () => {
    setStage('upload')
    setImage('')
    setRating(null)
    setError('')
  }

  return (
    <main>
      {error && stage === 'upload' && (
        <div className="fixed inset-x-0 top-4 z-10 mx-auto w-fit rounded-full bg-destructive px-5 py-2 text-sm font-medium text-white">
          {error}
        </div>
      )}
      {stage === 'upload' && <UploadScreen onSelect={analyze} />}
      {stage === 'analyzing' && <AnalyzingScreen image={image} />}
      {stage === 'results' && rating && <ResultsScreen image={image} rating={rating} onReset={reset} />}
    </main>
  )
}
