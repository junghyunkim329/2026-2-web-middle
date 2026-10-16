import { NextResponse } from 'next/server'
import { collections, type NvdCveResult } from '@/lib/mongodb'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000

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

function pickPrimaryMetric(metrics: NvdMetric[] | undefined) {
  return metrics?.find((metric) => metric.type === 'Primary') ?? metrics?.[0]
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id')?.trim().toUpperCase() ?? ''
  if (!/^CVE-\d{4}-\d{4,}$/.test(id)) {
    return NextResponse.json(
      { error: 'CVE ID 형식으로 입력해주세요. 예: CVE-2024-3094' },
      { status: 400 },
    )
  }

  const { nvdCveCache } = await collections()
  const now = new Date()
  const cached = await nvdCveCache.findOne({ cveId: id })
  if (cached && cached.expiresAt.getTime() > now.getTime()) {
    return NextResponse.json({ cve: cached.result, cached: true })
  }

  const url = new URL('https://services.nvd.nist.gov/rest/json/cves/2.0')
  url.searchParams.set('cveId', id)
  const headers = new Headers({ Accept: 'application/json' })
  const apiKey = process.env.NVD_API_KEY ?? process.env.NVD_API
  if (apiKey) headers.set('apiKey', apiKey)

  let response: Response
  const fetchNvd = (requestHeaders: Headers) =>
    fetch(url, {
      headers: requestHeaders,
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000),
    })
  try {
    response = await fetchNvd(headers)
    if (!response.ok && apiKey && [401, 403, 404].includes(response.status)) {
      console.warn(`NVD rejected the configured API key (${response.status}); retrying without it.`)
      headers.delete('apiKey')
      response = await fetchNvd(headers)
    }
  } catch (error) {
    console.error('NVD API request failed:', error)
    return NextResponse.json(
      { error: 'NVD에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.' },
      { status: 502 },
    )
  }

  if (!response.ok) {
    console.error(`NVD API returned ${response.status}`)
    return NextResponse.json(
      { error: 'NVD 조회에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 502 },
    )
  }

  let data: NvdResponse
  try {
    data = (await response.json()) as NvdResponse
  } catch (error) {
    console.error('NVD API returned invalid JSON:', error)
    return NextResponse.json(
      { error: 'NVD 응답을 읽을 수 없습니다. 잠시 후 다시 시도해주세요.' },
      { status: 502 },
    )
  }

  const cve = data.vulnerabilities?.[0]?.cve
  if (!cve) {
    return NextResponse.json(
      { error: `${id}에 대한 CVE 정보를 찾을 수 없습니다.` },
      { status: 404 },
    )
  }

  const metric =
    pickPrimaryMetric(cve.metrics?.cvssMetricV40) ??
    pickPrimaryMetric(cve.metrics?.cvssMetricV31) ??
    pickPrimaryMetric(cve.metrics?.cvssMetricV30) ??
    pickPrimaryMetric(cve.metrics?.cvssMetricV2)
  const description =
    cve.descriptions?.find((item) => item.lang === 'ko')?.value ??
    cve.descriptions?.find((item) => item.lang === 'en')?.value ??
    cve.descriptions?.[0]?.value ??
    '설명이 제공되지 않았습니다.'

  const result: NvdCveResult = {
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
            (metric.cvssData.baseScore === undefined
              ? null
              : metric.cvssData.baseScore >= 9
                ? 'CRITICAL'
                : metric.cvssData.baseScore >= 7
                  ? 'HIGH'
                  : metric.cvssData.baseScore >= 4
                    ? 'MEDIUM'
                    : 'LOW'),
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

  const fetchedAt = new Date()
  await nvdCveCache.updateOne(
    { cveId: id },
    {
      $set: {
        result,
        fetchedAt,
        expiresAt: new Date(fetchedAt.getTime() + CACHE_TTL_MS),
      },
    },
    { upsert: true },
  )

  return NextResponse.json({ cve: result, cached: false })
}
