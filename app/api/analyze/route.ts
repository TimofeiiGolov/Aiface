import { google } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
import { z } from 'zod'

export const maxDuration = 60

const ratingSchema = z.object({
  faceDetected: z.boolean().describe('Есть ли на фото человеческое лицо'),
  observations: z
    .string()
    .describe(
      'Подробное описание того, что реально видно на фото: форма и посадка глаз, высота скул, линия челюсти и подбородок, состояние волос и кожи, симметрия. 3-5 предложений. Заполняется ДО выставления оценок.',
    ),
  scores: z.object({
    eyes: z
      .number()
      .min(0)
      .max(100)
      .describe('Глаза: миндалевидность, горизонтальный наклон (positive canthal tilt), посадка, выразительность'),
    cheekbones: z
      .number()
      .min(0)
      .max(100)
      .describe('Скулы: высота, выраженность, впалость щёк под ними'),
    jaw: z
      .number()
      .min(0)
      .max(100)
      .describe('Челюсть: чёткость линии нижней челюсти, угол гониона, ширина и проекция подбородка'),
    hair: z.number().min(0).max(100).describe('Волосы: густота, линия роста, стрижка, ухоженность'),
    skin: z.number().min(0).max(100).describe('Кожа: чистота, ровность тона, текстура, отсутствие воспалений'),
    masculinity: z
      .number()
      .min(0)
      .max(100)
      .describe('Мужественность/харизматичность: общая гармония и выразительность черт'),
  }),
  comment: z.string().describe('Короткий дерзкий комментарий на русском, 1-2 предложения'),
})

export async function POST(req: Request) {
  try {
    const { image } = (await req.json()) as { image?: string }

    if (!image || !image.startsWith('data:image/')) {
      return Response.json({ error: 'Нужно фото' }, { status: 400 })
    }

    const [header, base64] = image.split(',')
    const mediaType = header.replace('data:', '').replace(';base64', '')

    const { output } = await generateText({
      model: google('gemini-flash-lite-latest'),
      output: Output.object({ schema: ratingSchema }),
      instructions:
        'Ты — развлекательный AI-бот для оценки внешности в стиле вирусных TikTok-приложений (looksmaxxing / face rating). ' +
        'Это шуточный развлекательный формат, пользователь сам загрузил своё фото и хочет получить честную оценку.\n\n' +
        'ПОРЯДОК РАБОТЫ:\n' +
        '1. Сначала внимательно рассмотри фото и заполни поле observations — опиши только то, что реально видно: форму глаз, скулы, линию челюсти, волосы, кожу, симметрию, качество фото.\n' +
        '2. Только после этого выставляй оценки, и каждая оценка должна логически следовать из твоих наблюдений.\n\n' +
        'КАЛИБРОВКА ШКАЛЫ (используй её строго):\n' +
        '- 30-45: заметно слабая черта (размытая линия челюсти, редеющие волосы, проблемная кожа)\n' +
        '- 46-60: средняя, ничем не выделяется\n' +
        '- 61-75: выше среднего, заметное достоинство\n' +
        '- 76-88: сильная, выразительная черта\n' +
        '- 89-100: исключительная, редко встречается — ставь только если черта реально выдающаяся\n\n' +
        'ПРАВИЛА ТОЧНОСТИ:\n' +
        '- Оценки разных параметров ДОЛЖНЫ отличаться друг от друга: у любого человека есть сильные и слабые черты. Разброс между максимальной и минимальной оценкой обычно 15-35 баллов.\n' +
        '- Не завышай из вежливости и не занижай ради шутки — оценка должна соответствовать наблюдениям.\n' +
        '- Если черта плохо видна (ракурс, тень, очки, шапка) — оценивай по тому, что видно, и отметь это в observations.\n' +
        '- Одно и то же лицо должно получать примерно одинаковые оценки при повторной загрузке.\n\n' +
        'Комментарий пиши на русском, дерзко и с юмором, но не оскорбительно — и он должен ссылаться на конкретные черты с фото. ' +
        'Если на фото нет человеческого лица — установи faceDetected в false.',
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Оцени мою внешность по всем параметрам.' },
            { type: 'file', data: base64, mediaType },
          ],
        },
      ],
    })

    if (!output.faceDetected) {
      return Response.json({ error: 'Лицо не найдено на фото. Попробуй другое фото.' }, { status: 422 })
    }

    const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))
    const scores = Object.fromEntries(
      Object.entries(output.scores).map(([k, v]) => [k, clamp(v)]),
    )

    return Response.json({ scores, comment: output.comment })
  } catch (error) {
    console.error('[v0] analyze error:', error)
    return Response.json({ error: 'Не удалось проанализировать фото. Попробуй ещё раз.' }, { status: 500 })
  }
}
