import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

export interface DetectedFace {
  // Нормализованные координаты точек (0-1) относительно исходного изображения
  points: [number, number][]
  // Линии сетки: пары индексов в массиве points
  lines: [number, number][]
  // Натуральные размеры изображения для viewBox
  width: number
  height: number
}

let landmarkerPromise: Promise<FaceLandmarker> | null = null

function getLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm',
      )
      return FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        numFaces: 1,
      })
    })().catch((e) => {
      landmarkerPromise = null
      throw e
    })
  }
  return landmarkerPromise
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Не удалось загрузить изображение'))
    img.src = src
  })
}

export async function detectFace(imageSrc: string): Promise<DetectedFace | null> {
  const [landmarker, img] = await Promise.all([getLandmarker(), loadImage(imageSrc)])
  const result = landmarker.detect(img)
  const landmarks = result.faceLandmarks?.[0]
  if (!landmarks || landmarks.length === 0) return null

  // Соединения контуров: овал лица, глаза, брови, губы + тесселяция для эффекта сетки
  const connections = [
    ...FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
    ...FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
    ...FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
    ...FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
    ...FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
    ...FaceLandmarker.FACE_LANDMARKS_LIPS,
  ]

  // Прореженная тесселяция, чтобы сетка была видна, но не перегружала экран
  const tesselation = FaceLandmarker.FACE_LANDMARKS_TESSELATION.filter((_, i) => i % 7 === 0)

  const allConnections = [...connections, ...tesselation]

  // Собираем только используемые точки и переиндексируем
  const usedIndices = new Set<number>()
  for (const c of allConnections) {
    usedIndices.add(c.start)
    usedIndices.add(c.end)
  }
  const indexMap = new Map<number, number>()
  const points: [number, number][] = []
  for (const idx of usedIndices) {
    indexMap.set(idx, points.length)
    points.push([landmarks[idx].x, landmarks[idx].y])
  }
  const lines: [number, number][] = allConnections.map((c) => [
    indexMap.get(c.start) as number,
    indexMap.get(c.end) as number,
  ])

  return { points, lines, width: img.naturalWidth, height: img.naturalHeight }
}
