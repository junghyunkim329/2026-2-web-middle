// lib/cwe.ts — MITRE 공식 CWE API에서 약점 설명·영향·대응·예제 코드를 가져오는 모듈 (학습 페이지에 없는 CWE용)
const CWE_ID_PATTERN = /^CWE-(\d+)$/

type MitreEntry = {
  IntroText?: string
  BodyText?: string
  Nature?: string
  Language?: string
  ExampleCode?: string
}

type MitreWeakness = {
  ID: string
  Name: string
  Abstraction?: string
  Status?: string
  Description?: string
  ExtendedDescription?: unknown
  CommonConsequences?: { Scope?: string[]; Impact?: string[]; Note?: string }[]
  PotentialMitigations?: { Phase?: string[]; Description?: unknown; Effectiveness?: string }[]
  DemonstrativeExamples?: { ID?: string; Entries?: MitreEntry[] }[]
  ObservedExamples?: { Reference?: string; Description?: string; Link?: string }[]
}

export type CweExampleBlock =
  | { kind: 'text'; text: string }
  | { kind: 'code'; nature: 'bad' | 'good' | 'other'; language: string | null; code: string }

export type CweReference = {
  id: string
  name: string
  abstraction: string | null
  description: string
  extendedDescription: string | null
  consequences: { scope: string[]; impact: string[] }[]
  mitigations: { phase: string[]; description: string }[]
  examples: CweExampleBlock[][]
  observed: { cveId: string; description: string }[]
  mitreUrl: string
}

export function normalizeCweId(raw: string) {
  let value = raw
  try {
    value = decodeURIComponent(raw)
  } catch {}
  const id = value.trim().toUpperCase()
  return CWE_ID_PATTERN.test(id) ? id : null
}

function asText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function cleanCode(code: string) {
  return code
    .split('\n')
    .filter((line) => !/^\s*```/.test(line))
    .join('\n')
    .replace(/\t/g, '  ')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+|\s+$/g, '')
}

function toExample(entries: MitreEntry[]): CweExampleBlock[] {
  const blocks: CweExampleBlock[] = []
  for (const entry of entries) {
    const intro = asText(entry.IntroText)
    const body = asText(entry.BodyText)
    if (intro) blocks.push({ kind: 'text', text: intro })
    if (entry.ExampleCode) {
      const nature = entry.Nature?.toLowerCase()
      blocks.push({
        kind: 'code',
        nature: nature === 'bad' ? 'bad' : nature === 'good' ? 'good' : 'other',
        language: entry.Language ?? null,
        code: cleanCode(entry.ExampleCode),
      })
    }
    if (body) blocks.push({ kind: 'text', text: body })
  }
  return blocks
}

export async function getMitreCwe(cweId: string): Promise<CweReference | null | 'error'> {
  const id = normalizeCweId(cweId)
  if (!id) return null
  const number = id.replace('CWE-', '')

  let weakness: MitreWeakness | undefined
  try {
    const response = await fetch(`https://cwe-api.mitre.org/api/v1/cwe/weakness/${number}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 * 60 * 24 },
      signal: AbortSignal.timeout(15000),
    })
    if (response.status === 404) return null
    if (!response.ok) return 'error'
    weakness = ((await response.json()) as { Weaknesses?: MitreWeakness[] }).Weaknesses?.[0]
  } catch (error) {
    console.error('MITRE CWE request failed:', error)
    return 'error'
  }
  if (!weakness) return null

  return {
    id,
    name: weakness.Name,
    abstraction: weakness.Abstraction ?? null,
    description: asText(weakness.Description) ?? '설명이 제공되지 않았습니다.',
    extendedDescription: asText(weakness.ExtendedDescription),
    consequences: (weakness.CommonConsequences ?? []).map((c) => ({ scope: c.Scope ?? [], impact: c.Impact ?? [] })),
    mitigations: (weakness.PotentialMitigations ?? [])
      .map((m) => ({ phase: m.Phase ?? [], description: asText(m.Description) ?? '' }))
      .filter((m) => m.description),
    examples: (weakness.DemonstrativeExamples ?? []).map((e) => toExample(e.Entries ?? [])).filter((e) => e.length > 0),
    observed: (weakness.ObservedExamples ?? [])
      .filter((o): o is { Reference: string; Description: string } => /^CVE-\d{4}-\d{4,}$/.test(o.Reference ?? ''))
      .map((o) => ({ cveId: o.Reference, description: o.Description ?? '' })),
    mitreUrl: `https://cwe.mitre.org/data/definitions/${number}.html`,
  }
}
