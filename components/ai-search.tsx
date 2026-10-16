'use client'

import { useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'

type CveResult = {
  id: string
  description: string
  published: string
  lastModified: string
  status: string | null
  cvss: {
    score: number | null
    severity: string | null
    version: string | null
    vector: string | null
  } | null
  weaknesses: string[]
  references: { url: string; source?: string }[]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value))
}

export function AiSearch() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<CveResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const references = [...new Map((result?.references ?? []).map((reference) => [reference.url, reference])).values()]

  async function searchCve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = query.trim()
    if (!id) {
      setError('CVE ID를 입력해주세요.')
      setResult(null)
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    try {
      const response = await fetch(`/api/cves?id=${encodeURIComponent(id)}`)
      const data = (await response.json()) as { cve?: CveResult; error?: string }
      if (!response.ok) throw new Error(data.error ?? 'CVE 조회에 실패했습니다.')
      if (!data.cve) throw new Error('NVD에서 올바른 응답을 받지 못했습니다.')
      setResult(data.cve)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'CVE 조회 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <form
        onSubmit={searchCve}
        className="flex gap-2 rounded-xl border border-border bg-card p-2 text-left shadow-lg shadow-black/20"
      >
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">CVE ID 검색</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="CVE-2024-3094"
            autoComplete="off"
            className="h-12 w-full rounded-lg bg-background pl-10 pr-3 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 shrink-0 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          <Search className="size-4" />
          {loading ? '조회 중' : '검색'}
        </button>
      </form>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        NVD 데이터베이스에서 CVE ID로 검색합니다.
      </p>

      <div className="mt-6 text-left" aria-live="polite">
        {error && (
          <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}
        {result && (
          <article className="rounded-xl border border-border bg-card p-5 shadow-lg shadow-black/20 sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-mono text-lg font-bold text-primary">{result.id}</h2>
              {result.cvss?.score !== null && result.cvss?.score !== undefined ? (
                <span className="rounded border border-border bg-secondary px-2 py-1 font-mono text-xs font-semibold text-foreground">
                  CVSS {result.cvss.version ? `${result.cvss.version} ` : ''}
                  {result.cvss.score.toFixed(1)}
                  {result.cvss.severity ? ` · ${result.cvss.severity}` : ''}
                </span>
              ) : (
                <span className="rounded border border-border bg-secondary px-2 py-1 font-mono text-xs text-muted-foreground">
                  CVSS 점수 없음
                </span>
              )}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-foreground">{result.description}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">공개일</dt>
                <dd className="mt-1 text-foreground">{formatDate(result.published)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">최종 수정</dt>
                <dd className="mt-1 text-foreground">{formatDate(result.lastModified)}</dd>
              </div>
              {result.status && (
                <div>
                  <dt className="text-muted-foreground">상태</dt>
                  <dd className="mt-1 text-foreground">{result.status}</dd>
                </div>
              )}
            </dl>
            {result.weaknesses.length > 0 && (
              <p className="mt-4 text-xs text-muted-foreground">
                관련 약점: <span className="font-mono text-foreground">{result.weaknesses.join(', ')}</span>
              </p>
            )}
            <a
              href={`https://nvd.nist.gov/vuln/detail/${encodeURIComponent(result.id)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex text-xs text-primary underline-offset-4 hover:underline"
            >
              NVD에서 상세 정보 보기 ↗
            </a>
            {references.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-border pt-4">
                {references.map((reference) => (
                  <li key={reference.url} className="truncate text-xs">
                    <a
                      href={reference.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                    >
                      {reference.source ? `${reference.source}: ` : ''}
                      {reference.url}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </article>
        )}
      </div>
    </div>
  )
}