// lib/nvd.ts — CVE 상세 페이지용 NVD API 조회 + MongoDB 캐시 모듈
import { collections, type NvdCveResult } from '@/lib/mongodb'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const CVE_ID_PATTERN = /^CVE-\d{4}-\d{4,}$/

type NvdMetric = {
  type?: string
  cvssData?: {
    baseScore?: number
    baseSeverity?: string
    vectorString?: string
    version?: string
  }
  severity?: string
}

type NvdCve = {
  id: string
  published: string
  lastModified: string
  vulnStatus?: string
  descriptions?: { lang: string; value: string }[]
  metrics?: {
    cvssMetricV40?: NvdMetric[]
    cvssMetricV31?: NvdMetric[]
    cvssMetricV30?: NvdMetric[]
    cvssMetricV2?: NvdMetric[]
  }
  weaknesses?: { description?: { lang: string; value: string }[] }[]
  references?: { url: string; source?: string }[]
}

type NvdResponse = {
  totalResults?: number
  vulnerabilities?: { cve?: NvdCve }[]
}

export type NvdLookup =
  | { ok: true; cve: NvdCveResult; cached: boolean }
  | { ok: false; status: number; error: string }

export function normalizeCveId(raw: string) {
  let value = raw
  try {
    value = decodeURIComponent(raw)
  } catch {}
  return value.trim().toUpperCase()
}

export function isCveId(id: string) {
  return CVE_ID_PATTERN.test(id)
}

export function pickDescription(descriptions: { lang: string; value: string }[] | undefined) {
  return (
    descriptions?.find((item) => item.lang === 'en' && item.value.trim())?.value ??
    '설명이 제공되지 않았습니다.'
  )
}

function pickPrimaryMetric(metrics: NvdMetric[] | undefined) {
  return metrics?.find((metric) => metric.type === 'Primary') ?? metrics?.[0]
}

function severityFromScore(score: number | undefined) {
  if (score === undefined) return null
  if (score >= 9) return 'CRITICAL'
  if (score >= 7) return 'HIGH'
  if (score >= 4) return 'MEDIUM'
  return 'LOW'
}

function toResult(cve: NvdCve): NvdCveResult {
  const metric =
    pickPrimaryMetric(cve.metrics?.cvssMetricV40) ??
    pickPrimaryMetric(cve.metrics?.cvssMetricV31) ??
    pickPrimaryMetric(cve.metrics?.cvssMetricV30) ??
    pickPrimaryMetric(cve.metrics?.cvssMetricV2)
  const description = pickDescription(cve.descriptions)

  return {
    id: cve.id,
    description,
    published: cve.published,
    lastModified: cve.lastModified,
    status: cve.vulnStatus ?? null,
    cvss: metric?.cvssData
      ? {
          score: metric.cvssData.baseScore ?? null,
          severity:
            metric.cvssData.baseSeverity ??
            metric.severity ??
            severityFromScore(metric.cvssData.baseScore),
          version: metric.cvssData.version ?? null,
          vector: metric.cvssData.vectorString ?? null,
        }
      : null,
    weaknesses:
      cve.weaknesses
        ?.flatMap((weakness) => weakness.description ?? [])
        .filter((item) => item.lang === 'en')
        .map((item) => item.value) ?? [],
    references: cve.references?.slice(0, 5) ?? [],
  }
}

async function readCache(id: string) {
  try {
    const { nvdCveCache } = await collections()
    const cached = await nvdCveCache.findOne({ cveId: id })
    if (cached && cached.expiresAt.getTime() > Date.now()) return cached.result
  } catch (error) {
    console.warn('NVD cache read skipped:', error)
  }
  return null
}

async function writeCache(id: string, result: NvdCveResult) {
  try {
    const { nvdCveCache } = await collections()
    const fetchedAt = new Date()
    await nvdCveCache.updateOne(
      { cveId: id },
      { $set: { result, fetchedAt, expiresAt: new Date(fetchedAt.getTime() + CACHE_TTL_MS) } },
      { upsert: true },
    )
  } catch (error) {
    console.warn('NVD cache write skipped:', error)
  }
}

export async function getNvdCve(rawId: string): Promise<NvdLookup> {
  const id = normalizeCveId(rawId)
  if (!isCveId(id)) {
    return { ok: false, status: 400, error: 'CVE ID 형식으로 입력해주세요. 예: CVE-2024-3094' }
  }

  const cached = await readCache(id)
  if (cached) return { ok: true, cve: cached, cached: true }

  const url = new URL('https://services.nvd.nist.gov/rest/json/cves/2.0')
  url.searchParams.set('cveId', id)
  const headers = new Headers({ Accept: 'application/json' })
  const apiKey = process.env.NVD_API_KEY ?? process.env.NVD_API
  if (apiKey) headers.set('apiKey', apiKey)

  const fetchNvd = (requestHeaders: Headers) =>
    fetch(url, {
      headers: requestHeaders,
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000),
    })

  let response: Response
  try {
    response = await fetchNvd(headers)
    if (!response.ok && apiKey && [401, 403, 404].includes(response.status)) {
      console.warn(`NVD rejected the configured API key (${response.status}); retrying without it.`)
      headers.delete('apiKey')
      response = await fetchNvd(headers)
    }
  } catch (error) {
    console.error('NVD API request failed:', error)
    return { ok: false, status: 502, error: 'NVD에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.' }
  }

  if (!response.ok) {
    console.error(`NVD API returned ${response.status}`)
    return { ok: false, status: 502, error: 'NVD 조회에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  }

  let data: NvdResponse
  try {
    data = (await response.json()) as NvdResponse
  } catch (error) {
    console.error('NVD API returned invalid JSON:', error)
    return { ok: false, status: 502, error: 'NVD 응답을 읽을 수 없습니다. 잠시 후 다시 시도해주세요.' }
  }

  const cve = data.vulnerabilities?.[0]?.cve
  if (!cve) {
    return { ok: false, status: 404, error: `${id}에 대한 CVE 정보를 찾을 수 없습니다.` }
  }

  const result = toResult(cve)
  await writeCache(id, result)
  return { ok: true, cve: result, cached: false }
}
