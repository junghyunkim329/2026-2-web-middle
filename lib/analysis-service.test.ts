import assert from 'node:assert/strict'
import test from 'node:test'

import { GeminiApiError } from './gemini.ts'
import { AnalysisServiceError, runCveAnalysis } from './analysis-service.ts'

const analysis = {
  summary: '요약',
  attackConditions: ['조건'],
  impact: ['영향'],
  mitigations: ['대응'],
  caution: '주의',
}

test('a cached analysis still consumes one user use but avoids Gemini', async () => {
  const result = await runCveAnalysis({
    userId: 'user-1',
    sourceKey: 'source-1',
    cve: { id: 'CVE-2026-1000', description: '설명', cvss: null, weaknesses: [] },
    dependencies: {
      isBlocked: async () => false,
      reserve: async () => ({ allowed: true, remaining: 4, dateKey: '2026-10-24' }),
      refund: async () => undefined,
      getCache: async () => ({ analysisSourceKey: 'source-1', analysis }),
      saveAnalysis: async () => undefined,
      blockDaily: async () => undefined,
      analyze: async () => {
        throw new Error('캐시 적중 시 호출되면 안 됩니다.')
      },
    },
  })

  assert.deepEqual(result, { analysis, remaining: 4, cached: true })
})

test('a failed Gemini analysis refunds the reserved use', async () => {
  let refunded = false
  await assert.rejects(
    () =>
      runCveAnalysis({
        userId: 'user-1',
        sourceKey: 'source-1',
        cve: { id: 'CVE-2026-1000', description: '설명', cvss: null, weaknesses: [] },
        dependencies: {
          isBlocked: async () => false,
          reserve: async () => ({ allowed: true, remaining: 4, dateKey: '2026-10-24' }),
          refund: async () => {
            refunded = true
          },
          getCache: async () => null,
          saveAnalysis: async () => undefined,
          blockDaily: async () => undefined,
          analyze: async () => {
            throw new Error('network')
          },
        },
      }),
    AnalysisServiceError,
  )
  assert.equal(refunded, true)
})

test('a daily Gemini error refunds the use and activates the shared lock', async () => {
  let refunded = false
  let blocked = false
  await assert.rejects(
    () =>
      runCveAnalysis({
        userId: 'user-1',
        sourceKey: 'source-1',
        cve: { id: 'CVE-2026-1000', description: '설명', cvss: null, weaknesses: [] },
        dependencies: {
          isBlocked: async () => false,
          reserve: async () => ({ allowed: true, remaining: 4, dateKey: '2026-10-24' }),
          refund: async () => {
            refunded = true
          },
          getCache: async () => null,
          saveAnalysis: async () => undefined,
          blockDaily: async () => {
            blocked = true
          },
          analyze: async () => {
            throw new GeminiApiError('quota', 429, 'daily')
          },
        },
      }),
    (error) => error instanceof AnalysisServiceError && error.code === 'GLOBAL_QUOTA',
  )
  assert.equal(refunded, true)
  assert.equal(blocked, true)
})

