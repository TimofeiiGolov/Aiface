'use client'

import { useRef, useState } from 'react'
import { Upload, ScanFace } from 'lucide-react'

export function UploadScreen({ onSelect }: { onSelect: (dataUrl: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const readFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => onSelect(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ScanFace className="size-8" aria-hidden="true" />
        </div>
        <h1 className="font-mono text-2xl font-bold uppercase tracking-[0.2em] text-primary text-balance">
          Анализ лица
        </h1>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground text-pretty">
          AI оценит твою внешность по 6 параметрам и определит твой ранг — от Sub5 до Gigachad
        </p>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const file = e.dataTransfer.files?.[0]
          if (file) readFile(file)
        }}
        className={`flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-8 py-12 transition-colors ${
          dragOver ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/60'
        }`}
      >
        <Upload className="size-8 text-primary" aria-hidden="true" />
        <span className="text-sm font-medium">Загрузи своё фото</span>
        <span className="text-xs text-muted-foreground">Нажми или перетащи файл сюда</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Выбрать фото"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) readFile(file)
        }}
      />

      <p className="text-xs text-muted-foreground">Фото не сохраняется — только анализ</p>
    </div>
  )
}
