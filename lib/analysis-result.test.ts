import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AnalysisValidationError,
  validateAnalysisRequest,
  validateCveAnalysis,
} from './analysis-result.ts'

test('validateAnalysisRequest normalizes a valid CVE ID', () => {
  assert.deepEqual(validateAnalysisRequest({ cveId: ' cve-2026-12345 ' }), {
    cveId: 'CVE-2026-12345',
  })
})

test('validateAnalysisRequest rejects an invalid CVE ID', () => {
  assert.throws(
    () => validateAnalysisRequest({ cveId: 'not-a-cve' }),
    AnalysisValidationError,
  )
})

test('validateCveAnalysis accepts a complete structured result', () => {
  const analysis = {
    summary: '네트워크 헤더 검증 과정에서 발생하는 취약점입니다.',
    attackConditions: ['조작된 체크섬 메타데이터가 필요합니다.'],
    impact: ['네트워크 헤더가 손상될 수 있습니다.'],
    mitigations: ['공식 커널 패치를 적용합니다.'],
    caution: 'AI 분석이므로 공식 벤더 공지를 함께 확인해야 합니다.',
  }

  assert.deepEqual(validateCveAnalysis(analysis), analysis)
})

test('validateCveAnalysis rejects empty analysis lists', () => {
  assert.throws(
    () =>
      validateCveAnalysis({
        summary: '요약',
        attackConditions: [],
        impact: ['영향'],
        mitigations: ['대응'],
        caution: '주의',
      }),
    AnalysisValidationError,
  )
})

test('validateCveAnalysis rejects unexpected fields', () => {
  assert.throws(
    () =>
      validateCveAnalysis({
        summary: '요약',
        attackConditions: ['조건'],
        impact: ['영향'],
        mitigations: ['대응'],
        caution: '주의',
        inventedScore: 100,
      }),
    AnalysisValidationError,
  )
})

