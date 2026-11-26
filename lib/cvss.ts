// lib/cvss.ts — CVSS 벡터 문자열을 사람이 읽을 수 있는 한국어 항목으로 풀어주는 유틸
export type CvssSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'

export type CvssMetricItem = {
  key: string
  label: string
  value: string
  raw: string
  risk: 'high' | 'mid' | 'low'
}

type MetricDef = {
  label: string
  values: Record<string, { text: string; risk: CvssMetricItem['risk'] }>
}

const IMPACT = {
  H: { text: '높음', risk: 'high' },
  L: { text: '낮음', risk: 'mid' },
  N: { text: '없음', risk: 'low' },
} as const

const METRICS: Record<string, MetricDef> = {
  AV: {
    label: '공격 벡터',
    values: {
      N: { text: '네트워크', risk: 'high' },
      A: { text: '인접 네트워크', risk: 'mid' },
      L: { text: '로컬', risk: 'low' },
      P: { text: '물리적', risk: 'low' },
    },
  },
  AC: {
    label: '공격 복잡도',
    values: {
      L: { text: '낮음', risk: 'high' },
      M: { text: '보통', risk: 'mid' },
      H: { text: '높음', risk: 'low' },
    },
  },
  AT: {
    label: '공격 전제 조건',
    values: {
      N: { text: '없음', risk: 'high' },
      P: { text: '있음', risk: 'low' },
    },
  },
  PR: {
    label: '필요 권한',
    values: {
      N: { text: '없음', risk: 'high' },
      L: { text: '낮음', risk: 'mid' },
      H: { text: '높음', risk: 'low' },
    },
  },
  Au: {
    label: '인증',
    values: {
      N: { text: '불필요', risk: 'high' },
      S: { text: '1회', risk: 'mid' },
      M: { text: '여러 번', risk: 'low' },
    },
  },
  UI: {
    label: '사용자 상호작용',
    values: {
      N: { text: '불필요', risk: 'high' },
      R: { text: '필요', risk: 'low' },
      P: { text: '수동적', risk: 'mid' },
      A: { text: '능동적', risk: 'low' },
    },
  },
  S: {
    label: '범위',
    values: {
      C: { text: '변경됨', risk: 'high' },
      U: { text: '변경 없음', risk: 'low' },
    },
  },
  C: { label: '기밀성 영향', values: { ...IMPACT, P: { text: '부분', risk: 'mid' }, C: { text: '완전', risk: 'high' } } },
  I: { label: '무결성 영향', values: { ...IMPACT, P: { text: '부분', risk: 'mid' }, C: { text: '완전', risk: 'high' } } },
  A: { label: '가용성 영향', values: { ...IMPACT, P: { text: '부분', risk: 'mid' }, C: { text: '완전', risk: 'high' } } },
  VC: { label: '기밀성 영향 (대상)', values: IMPACT },
  VI: { label: '무결성 영향 (대상)', values: IMPACT },
  VA: { label: '가용성 영향 (대상)', values: IMPACT },
  SC: { label: '기밀성 영향 (후속)', values: IMPACT },
  SI: { label: '무결성 영향 (후속)', values: IMPACT },
  SA: { label: '가용성 영향 (후속)', values: IMPACT },
}

export function parseCvssVector(vector: string | null | undefined): CvssMetricItem[] {
  if (!vector) return []
  return vector
    .split('/')
    .filter((part) => !part.startsWith('CVSS:'))
    .map((part) => {
      const [key, code] = part.split(':')
      const def = METRICS[key]
      const value = def?.values[code]
      return {
        key,
        label: def?.label ?? key,
        value: value?.text ?? code ?? '-',
        raw: part,
        risk: value?.risk ?? 'low',
      }
    })
}

export function toSeverity(severity: string | null | undefined, score: number | null | undefined): CvssSeverity {
  const upper = severity?.toUpperCase()
  if (upper === 'CRITICAL' || upper === 'HIGH' || upper === 'MEDIUM' || upper === 'LOW' || upper === 'NONE') {
    return upper
  }
  if (score === null || score === undefined) return 'NONE'
  if (score >= 9) return 'CRITICAL'
  if (score >= 7) return 'HIGH'
  if (score >= 4) return 'MEDIUM'
  if (score > 0) return 'LOW'
  return 'NONE'
}

export const severityStyle: Record<CvssSeverity, { label: string; text: string; badge: string; bar: string }> = {
  CRITICAL: {
    label: '치명적',
    text: 'text-destructive',
    badge: 'border-destructive/50 bg-destructive/10 text-destructive',
    bar: 'bg-destructive',
  },
  HIGH: {
    label: '높음',
    text: 'text-warning',
    badge: 'border-warning/50 bg-warning/10 text-warning',
    bar: 'bg-warning',
  },
  MEDIUM: {
    label: '보통',
    text: 'text-accent',
    badge: 'border-accent/50 bg-accent/10 text-accent',
    bar: 'bg-accent',
  },
  LOW: {
    label: '낮음',
    text: 'text-primary',
    badge: 'border-primary/50 bg-primary/10 text-primary',
    bar: 'bg-primary',
  },
  NONE: {
    label: '정보 없음',
    text: 'text-muted-foreground',
    badge: 'border-border bg-secondary text-muted-foreground',
    bar: 'bg-muted-foreground',
  },
}
