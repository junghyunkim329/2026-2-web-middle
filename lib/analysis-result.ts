export type CveAnalysis = {
  summary: string
  attackConditions: string[]
  impact: string[]
  mitigations: string[]
  caution: string
}

export class AnalysisValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AnalysisValidationError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function requireString(value: unknown, label: string, max: number) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    throw new AnalysisValidationError(`${label} 형식이 올바르지 않습니다.`)
  }
  return value.trim()
}

function requireStringList(value: unknown, label: string) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 8) {
    throw new AnalysisValidationError(`${label} 형식이 올바르지 않습니다.`)
  }
  return value.map((item) => requireString(item, label, 500))
}

export function validateAnalysisRequest(value: unknown) {
  if (!isRecord(value) || Object.keys(value).some((key) => key !== 'cveId')) {
    throw new AnalysisValidationError('요청 형식이 올바르지 않습니다.')
  }
  const cveId = typeof value.cveId === 'string' ? value.cveId.trim().toUpperCase() : ''
  if (!/^CVE-\d{4}-\d{4,}$/.test(cveId)) {
    throw new AnalysisValidationError('올바른 CVE ID가 필요합니다.')
  }
  return { cveId }
}

export function validateCveAnalysis(value: unknown): CveAnalysis {
  if (!isRecord(value)) throw new AnalysisValidationError('AI 분석 형식이 올바르지 않습니다.')
  const allowed = new Set(['summary', 'attackConditions', 'impact', 'mitigations', 'caution'])
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new AnalysisValidationError('AI 분석에 예상하지 못한 항목이 있습니다.')
  }
  return {
    summary: requireString(value.summary, '요약', 2_000),
    attackConditions: requireStringList(value.attackConditions, '공격 조건'),
    impact: requireStringList(value.impact, '영향'),
    mitigations: requireStringList(value.mitigations, '대응 방법'),
    caution: requireString(value.caution, '주의사항', 500),
  }
}

