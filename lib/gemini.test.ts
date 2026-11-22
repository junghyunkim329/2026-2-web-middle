import assert from 'node:assert/strict'
import test from 'node:test'

import { GeminiApiError, createGeminiClient } from './gemini.ts'

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

test('translateCveDescription returns a structured Korean translation', async () => {
  const client = createGeminiClient({
    apiKey: 'test-key',
    fetchImpl: async () =>
      jsonResponse({
        candidates: [{ content: { parts: [{ text: '{"translation":"리눅스 커널 취약점입니다."}' }] } }],
      }),
  })

  assert.equal(
    await client.translateCveDescription('A Linux kernel vulnerability.'),
    '리눅스 커널 취약점입니다.',
  )
})

test('translateCveDescription rejects malformed generated output', async () => {
  const client = createGeminiClient({
    apiKey: 'test-key',
    fetchImpl: async () =>
      jsonResponse({ candidates: [{ content: { parts: [{ text: '{"wrong":"value"}' }] } }] }),
  })

  await assert.rejects(
    () => client.translateCveDescription('A Linux kernel vulnerability.'),
    /한국어 번역/,
  )
})

test('Gemini 503 falls back to the configured secondary model', async () => {
  const requestedModels: string[] = []
  const client = createGeminiClient({
    apiKey: 'test-key',
    model: 'primary-model',
    fallbackModel: 'fallback-model',
    fetchImpl: async (input) => {
      requestedModels.push(String(input))
      if (requestedModels.length === 1) {
        return jsonResponse(
          { error: { status: 'UNAVAILABLE', message: 'This model is currently experiencing high demand.' } },
          503,
        )
      }
      return jsonResponse({
        candidates: [{ content: { parts: [{ text: '{"translation":"대체 모델 번역입니다."}' }] } }],
      })
    },
  })

  assert.equal(
    await client.translateCveDescription('A vulnerability.'),
    '대체 모델 번역입니다.',
  )
  assert.deepEqual(
    requestedModels.map((url) => new URL(url).pathname),
    [
      '/v1beta/models/primary-model:generateContent',
      '/v1beta/models/fallback-model:generateContent',
    ],
  )
})

test('Gemini timeout falls back to the configured secondary model', async () => {
  let attempts = 0
  const client = createGeminiClient({
    apiKey: 'test-key',
    model: 'primary-model',
    fallbackModel: 'fallback-model',
    fetchImpl: async () => {
      attempts += 1
      if (attempts === 1) throw new DOMException('Timed out', 'TimeoutError')
      return jsonResponse({
        candidates: [{ content: { parts: [{ text: '{"translation":"시간 초과 후 번역입니다."}' }] } }],
      })
    },
  })

  assert.equal(
    await client.translateCveDescription('A vulnerability.'),
    '시간 초과 후 번역입니다.',
  )
  assert.equal(attempts, 2)
})

test('Gemini per-minute 429 remains a temporary error', async () => {
  const client = createGeminiClient({
    apiKey: 'test-key',
    fetchImpl: async () =>
      jsonResponse(
        { error: { details: [{ quotaId: 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier' }] } },
        429,
      ),
  })

  await assert.rejects(
    () => client.translateCveDescription('A Linux kernel vulnerability.'),
    (error) => error instanceof GeminiApiError && error.rateLimitKind === 'temporary',
  )
})

test('Gemini per-day 429 is marked for the shared daily lock', async () => {
  const client = createGeminiClient({
    apiKey: 'test-key',
    fetchImpl: async () =>
      jsonResponse(
        { error: { details: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier' }] } },
        429,
      ),
  })

  await assert.rejects(
    () => client.translateCveDescription('A Linux kernel vulnerability.'),
    (error) => error instanceof GeminiApiError && error.rateLimitKind === 'daily',
  )
})

test('Gemini requests fail closed when the server API key is missing', async () => {
  const client = createGeminiClient({ apiKey: '', fetchImpl: async () => jsonResponse({}) })

  await assert.rejects(
    () => client.translateCveDescription('A Linux kernel vulnerability.'),
    /GEMINI_API_KEY/,
  )
})

test('analyzeCve returns a validated structured security analysis', async () => {
  const expected = {
    summary: '커널 네트워크 처리 취약점입니다.',
    attackConditions: ['조작된 패킷 입력이 필요합니다.'],
    impact: ['네트워크 헤더가 손상될 수 있습니다.'],
    mitigations: ['공식 보안 패치를 적용합니다.'],
    caution: 'AI 분석이므로 공식 공지를 확인해야 합니다.',
  }
  const client = createGeminiClient({
    apiKey: 'test-key',
    fetchImpl: async () =>
      jsonResponse({
        candidates: [{ content: { parts: [{ text: JSON.stringify(expected) }] } }],
      }),
  })

  assert.deepEqual(
    await client.analyzeCve({
      id: 'CVE-2026-1000',
      description: '리눅스 커널 취약점입니다.',
      cvss: { score: 9.3, severity: 'CRITICAL', vector: null },
      weaknesses: ['CWE-20'],
    }),
    expected,
  )
})

test('analyzeCve rejects incomplete generated analysis', async () => {
  const client = createGeminiClient({
    apiKey: 'test-key',
    fetchImpl: async () =>
      jsonResponse({
        candidates: [{ content: { parts: [{ text: '{"summary":"요약"}' }] } }],
      }),
  })

  await assert.rejects(
    () =>
      client.analyzeCve({
        id: 'CVE-2026-1000',
        description: '리눅스 커널 취약점입니다.',
        cvss: null,
        weaknesses: [],
      }),
    /형식/,
  )
})

