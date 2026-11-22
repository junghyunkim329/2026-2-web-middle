import assert from 'node:assert/strict'
import test from 'node:test'

import {
  classifyGeminiRateLimit,
  dateKeyInZone,
  isProbablyKorean,
  parseGeminiJson,
} from './ai-policy.ts'

test('dateKeyInZone separates the Korean and Pacific provider days', () => {
  const instant = new Date('2026-10-24T15:30:00.000Z')

  assert.equal(dateKeyInZone(instant, 'Asia/Seoul'), '2026-10-25')
  assert.equal(dateKeyInZone(instant, 'America/Los_Angeles'), '2026-10-24')
})

test('classifyGeminiRateLimit recognizes a per-day quota exhaustion', () => {
  const payload = {
    error: {
      code: 429,
      details: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier' }],
    },
  }

  assert.equal(classifyGeminiRateLimit(429, payload), 'daily')
})

test('classifyGeminiRateLimit keeps per-minute quota exhaustion temporary', () => {
  const payload = {
    error: {
      code: 429,
      details: [{ quotaId: 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier' }],
    },
  }

  assert.equal(classifyGeminiRateLimit(429, payload), 'temporary')
  assert.equal(classifyGeminiRateLimit(503, payload), null)
})

test('parseGeminiJson extracts JSON from the first generated text part', () => {
  const payload = {
    candidates: [{ content: { parts: [{ text: '{"translation":"커널 취약점"}' }] } }],
  }

  assert.deepEqual(parseGeminiJson<{ translation: string }>(payload), {
    translation: '커널 취약점',
  })
})

test('parseGeminiJson rejects responses without generated text', () => {
  assert.throws(() => parseGeminiJson({ candidates: [] }), /응답 본문/)
})

test('isProbablyKorean requires at least one Hangul syllable', () => {
  assert.equal(isProbablyKorean('Linux kernel 취약점이 수정되었습니다.'), true)
  assert.equal(isProbablyKorean('A Linux kernel vulnerability was fixed.'), false)
})

