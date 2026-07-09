'use client'

import { useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  RANKS,
  averageScore,
  rankIndexFromAverage,
  type FaceRating,
} from '@/lib/face-rating'

function scoreColor(score: number): string {
  if (score < 60) return 'var(--score-low)'
  if (score < 75) return 'var(--score-mid)'
  return 'var(--score-high)'
}

export function ResultsScreen({
  image,
  rating,
  onReset,
}: {
  image: string
  rating: FaceRating
  onReset: () => void
}) {
  const [revealed, setRevealed] = useState(false)
  const [showRank, setShowRank] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setRevealed(true), 150)
    const t2 = setTimeout(() => setShowRank(true), 1800)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  const avg = averageScore(rating.scores)
  const rankIndex = rankIndexFromAverage(avg)

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="relative size-40 overflow-hidden rounded-2xl border-2 border-primary/60 shadow-[0_0_24px_2px_color-mix(in_oklch,var(--primary)_40%,transparent)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image || '/placeholder.svg'} alt="Ваше фото" className="size-full object-cover" />
      </div>

      {/* Score bars */}
      <div className="flex w-full max-w-sm flex-col gap-3">
        {CATEGORY_ORDER.map((key, i) => {
          const score = rating.scores[key]
          const color = scoreColor(score)
          return (
            <div key={key} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium tracking-wide text-foreground/90">
                  {CATEGORY_LABELS[key]}
                </span>
                <span className="font-mono text-sm font-bold" style={{ color }}>
                  {score}
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-muted"
                role="meter"
                aria-valuenow={score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={CATEGORY_LABELS[key]}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: revealed ? `${score}%` : '0%',
                    backgroundColor: color,
                    transitionDelay: `${i * 150}ms`,
                    boxShadow: `0 0 8px ${color}`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Rank scale */}
      <div
        className={`flex flex-col items-center gap-4 transition-opacity duration-700 ${
          showRank ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p className="font-mono text-sm font-bold uppercase tracking-[0.3em] text-primary">Твой ранг</p>
        <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-xl bg-card p-3">
          {RANKS.map((rank, i) => {
            const active = i === rankIndex
            return (
              <span
                key={rank.id}
                className={`rounded-md border px-2 py-1 font-mono text-[10px] font-bold transition-all ${
                  active ? 'scale-110' : 'opacity-35'
                }`}
                style={
                  active
                    ? {
                        borderColor: rank.color,
                        color: rank.color,
                        boxShadow: `0 0 12px ${rank.color}`,
                      }
                    : { borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
                }
              >
                {rank.label}
              </span>
            )
          })}
        </div>
        <p className="text-2xl font-bold" style={{ color: RANKS[rankIndex].color }}>
          {RANKS[rankIndex].label}
        </p>
        <p className="max-w-xs text-center text-sm leading-relaxed text-muted-foreground text-pretty">
          {rating.comment}
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          {'Средний балл: '}
          <span className="text-primary">{avg}</span>
          {' / 100'}
        </p>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        Попробовать ещё раз
      </button>
    </div>
  )
}
