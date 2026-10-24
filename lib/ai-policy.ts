type GeminiPayload = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

export function dateKeyInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function classifyGeminiRateLimit(
  status: number,
  payload: unknown,
): 'daily' | 'temporary' | null {
  if (status !== 429) return null

  const normalized = JSON.stringify(payload).toLowerCase()
  const isDaily = [
    'perday',
    'per_day',
    'requests per day',
    'daily quota',
  ].some((marker) => normalized.includes(marker))
  return isDaily ? 'daily' : 'temporary'
}

export function parseGeminiJson<T>(payload: unknown): T {
  const text = (payload as GeminiPayload)?.candidates?.[0]?.content?.parts?.find(
    (part) => typeof part.text === 'string',
  )?.text
  if (!text) throw new Error('Gemini 응답 본문이 없습니다.')

  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('Gemini 응답이 올바른 JSON 형식이 아닙니다.')
  }
}

export function isProbablyKorean(text: string) {
  return /[가-힣]/.test(text)
}

