import assert from 'node:assert/strict'
import test from 'node:test'

import { createAiStore, type AiStoreBackend } from './ai-store-core.ts'

class MemoryBackend implements AiStoreBackend<string> {
  private usage = new Map<string, number>()
  private blockedProviderDate: string | null = null

  async incrementUsageIfBelow(userId: string, dateKey: string, limit: number) {
    const key = `${userId}:${dateKey}`
    const current = this.usage.get(key) ?? 0
    if (current >= limit) return null
    const next = current + 1
    this.usage.set(key, next)
    return next
  }

  async decrementUsage(userId: string, dateKey: string) {
    const key = `${userId}:${dateKey}`
    const current = this.usage.get(key) ?? 0
    this.usage.set(key, Math.max(0, current - 1))
  }

  async getBlockedProviderDate() {
    return this.blockedProviderDate
  }

  async setBlockedProviderDate(dateKey: string) {
    this.blockedProviderDate = dateKey
  }
}

test('reserveAnalysisUse allows five Korean-day uses and rejects the sixth', async () => {
  const backend = new MemoryBackend()
  const store = createAiStore({
    backend,
    now: () => new Date('2026-10-24T03:00:00.000Z'),
  })

  for (const remaining of [4, 3, 2, 1, 0]) {
    assert.deepEqual(await store.reserveAnalysisUse('user-1'), {
      allowed: true,
      remaining,
      dateKey: '2026-10-24',
    })
  }
  assert.deepEqual(await store.reserveAnalysisUse('user-1'), {
    allowed: false,
    remaining: 0,
    dateKey: '2026-10-24',
  })
})

test('refundAnalysisUse restores one failed analysis reservation', async () => {
  const backend = new MemoryBackend()
  const store = createAiStore({
    backend,
    now: () => new Date('2026-10-24T03:00:00.000Z'),
  })

  const reservation = await store.reserveAnalysisUse('user-1')
  await store.refundAnalysisUse('user-1', reservation.dateKey)

  assert.deepEqual(await store.reserveAnalysisUse('user-1'), {
    allowed: true,
    remaining: 4,
    dateKey: '2026-10-24',
  })
})

test('the shared Gemini lock expires when the Pacific calendar day changes', async () => {
  const backend = new MemoryBackend()
  let now = new Date('2026-01-01T07:59:00.000Z')
  const store = createAiStore({ backend, now: () => now })

  await store.blockGeminiForCurrentProviderDay()
  assert.equal(await store.isGeminiBlocked(), true)

  now = new Date('2026-01-01T08:01:00.000Z')
  assert.equal(await store.isGeminiBlocked(), false)
})

