export type CategoryKey = 'eyes' | 'cheekbones' | 'jaw' | 'hair' | 'skin' | 'masculinity'

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  eyes: 'Глаза',
  cheekbones: 'Скулы',
  jaw: 'Челюсть',
  hair: 'Волосы',
  skin: 'Кожа',
  masculinity: 'Мужественность',
}

export const CATEGORY_ORDER: CategoryKey[] = ['eyes', 'cheekbones', 'jaw', 'hair', 'skin', 'masculinity']

export interface FaceRating {
  scores: Record<CategoryKey, number>
  comment: string
}

export const RANKS = [
  { id: 'SUB5', label: 'SUB5', color: '#e84057' },
  { id: 'SUB6', label: 'SUB6', color: '#f0713a' },
  { id: 'LTN', label: 'LTN', color: '#f5c542' },
  { id: 'MTN', label: 'MTN', color: '#4dd8c8' },
  { id: 'HTN', label: 'HTN', color: '#5ec9f5' },
  { id: 'CHADLITE', label: 'CHADLITE', color: '#7ee85e' },
  { id: 'CHAD', label: 'CHAD', color: '#b98aff' },
  { id: 'GIGACHAD', label: 'GIGACHAD', color: '#ffd700' },
] as const

export function averageScore(scores: Record<CategoryKey, number>): number {
  const values = CATEGORY_ORDER.map((k) => scores[k])
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

export function rankIndexFromAverage(avg: number): number {
  if (avg < 40) return 0
  if (avg < 50) return 1
  if (avg < 60) return 2
  if (avg < 68) return 3
  if (avg < 76) return 4
  if (avg < 84) return 5
  if (avg < 92) return 6
  return 7
}
