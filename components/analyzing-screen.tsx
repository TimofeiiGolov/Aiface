'use client'

import { useEffect, useState } from 'react'
import { detectFace, type DetectedFace } from '@/lib/face-landmarks'

const PHASES = [
  'обнаруживаем ключевые точки...',
  'выстраиваем сетку лица...',
  'вычисляем пропорции и симметрию...',
  'сравниваем с эталонами...',
  'определяем ранг...',
]

// Запасная разметка face mesh (нормализованные координаты 0-1), если детекция не сработала
const FALLBACK_POINTS: [number, number][] = [
  [0.5, 0.12], [0.36, 0.16], [0.26, 0.26], [0.21, 0.4], [0.21, 0.54], [0.25, 0.68], [0.33, 0.8], [0.42, 0.88], [0.5, 0.91],
  [0.58, 0.88], [0.67, 0.8], [0.75, 0.68], [0.79, 0.54], [0.79, 0.4], [0.74, 0.26], [0.64, 0.16],
  [0.3, 0.34], [0.37, 0.31], [0.44, 0.33], [0.56, 0.33], [0.63, 0.31], [0.7, 0.34],
  [0.33, 0.41], [0.39, 0.39], [0.44, 0.41], [0.39, 0.43], [0.56, 0.41], [0.61, 0.39], [0.67, 0.41], [0.61, 0.43],
  [0.5, 0.42], [0.5, 0.5], [0.46, 0.57], [0.5, 0.59], [0.54, 0.57],
  [0.41, 0.68], [0.46, 0.66], [0.5, 0.67], [0.54, 0.66], [0.59, 0.68], [0.54, 0.72], [0.5, 0.73], [0.46, 0.72],
  [0.5, 0.82], [0.31, 0.56], [0.69, 0.56],
]

const FALLBACK_LINES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
  [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 0],
  [16, 17], [17, 18], [19, 20], [20, 21],
  [22, 23], [23, 24], [24, 25], [25, 22], [26, 27], [27, 28], [28, 29], [29, 26],
  [30, 31], [31, 32], [32, 33], [33, 34], [31, 34],
  [35, 36], [36, 37], [37, 38], [38, 39], [39, 40], [40, 41], [41, 42], [42, 35],
  [24, 30], [26, 30], [43, 39], [44, 22], [44, 3], [45, 29], [45, 13],
  [18, 24], [19, 26], [31, 44], [31, 45], [37, 33], [43, 8],
]

const FALLBACK_FACE: DetectedFace = {
  points: FALLBACK_POINTS,
  lines: FALLBACK_LINES,
  width: 1,
  height: 1,
}

export function AnalyzingScreen({ image }: { image: string }) {
  const [phase, setPhase] = useState(0)
  const [face, setFace] = useState<DetectedFace | null>(null)

  useEffect(() => {
    const id = setInterval(() => {
      setPhase((p) => (p + 1) % PHASES.length)
    }, 1800)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    detectFace(image)
      .then((detected) => {
        if (!cancelled) setFace(detected ?? FALLBACK_FACE)
      })
      .catch(() => {
        if (!cancelled) setFace(FALLBACK_FACE)
      })
    return () => {
      cancelled = true
    }
  }, [image])

  // Нормализуем viewBox так, чтобы меньшая сторона была 100 юнитов —
  // тогда CSS-анимации (stroke-width, dasharray) выглядят одинаково для любых фото
  const aspect = face ? face.width / face.height : 1
  const vbW = aspect <= 1 ? 100 : 100 * aspect
  const vbH = aspect <= 1 ? 100 / aspect : 100

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6">
      <div className="animate-pulse-glow relative size-56 overflow-hidden rounded-2xl border-2 border-primary/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image || '/placeholder.svg'} alt="Ваше фото" className="size-full object-cover" />

        {/* Сетка точек лица — совпадает с кадрированием object-cover через slice */}
        {face && (
          <svg
            viewBox={`0 0 ${vbW} ${vbH}`}
            className="absolute inset-0 size-full"
            aria-hidden="true"
            preserveAspectRatio="xMidYMid slice"
          >
            {face.lines.map(([a, b], i) => {
              const [x1, y1] = face.points[a]
              const [x2, y2] = face.points[b]
              return (
                <line
                  key={`l-${i}`}
                  x1={x1 * vbW}
                  y1={y1 * vbH}
                  x2={x2 * vbW}
                  y2={y2 * vbH}
                  className="mesh-line"
                  style={{ animationDelay: `${1.2 + (i % 60) * 0.045}s` }}
                />
              )
            })}
            {face.points.map(([x, y], i) => (
              <circle
                key={`p-${i}`}
                cx={x * vbW}
                cy={y * vbH}
                r="0.8"
                className="mesh-dot"
                style={{ animationDelay: `${(i % 40) * 0.055}s` }}
              />
            ))}
          </svg>
        )}

        <div
          className="animate-scan-line absolute left-0 h-[3px] w-full bg-primary shadow-[0_0_12px_2px_var(--primary)]"
          aria-hidden="true"
        />
      </div>

      <div className="flex flex-col items-center gap-2 text-center" role="status" aria-live="polite">
        <p className="font-mono text-lg font-bold uppercase tracking-[0.3em] text-primary">Анализ лица</p>
        <p className="text-sm text-muted-foreground">{PHASES[phase]}</p>
      </div>
    </div>
  )
}
