// components/ai-search.tsx — 메인 화면 CVE 검색창과 검색 결과 카드 (CVE ID 클릭 시 상세 페이지로 이동)
'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Search, Sparkles } from 'lucide-react'

type CveResult = {
  id: string
  description: string
  translationFailed: boolean
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

type CveAnalysis = {
  summary: string
  attackConditions: string[]
  impact: string[]
  mitigations: string[]
  caution: string
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value))
}

export function AiSearch() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<CveResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<CveAnalysis | null>(null)
  const [analysisError, setAnalysisError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [remainingAnalyses, setRemainingAnalyses] = useState<number | null>(null)
  const [analysisBlocked, setAnalysisBlocked] = useState(false)
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
    setAnalysis(null)
    setAnalysisError('')
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

  async function requestAnalysis() {
    if (!result || analyzing || analysisBlocked || remainingAnalyses === 0) return

    setAnalyzing(true)
    setAnalysisError('')
    try {
      const response = await fetch('/api/cves/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cveId: result.id }),
      })
      const data = (await response.json()) as {
        analysis?: CveAnalysis
        remaining?: number
        error?: string
      }
      if (!response.ok) {
        if (response.status === 503 && data.error?.includes('전체 AI 사용량')) {
          setAnalysisBlocked(true)
        }
        if (response.status === 429) setRemainingAnalyses(0)
        throw new Error(data.error ?? 'AI 추가 분석에 실패했습니다.')
      }
      if (!data.analysis || typeof data.remaining !== 'number') {
        throw new Error('AI 분석 응답 형식이 올바르지 않습니다.')
      }
      setAnalysis(data.analysis)
      setRemainingAnalyses(data.remaining)
    } catch (cause) {
      setAnalysisError(cause instanceof Error ? cause.message : 'AI 추가 분석 중 오류가 발생했습니다.')
    } finally {
      setAnalyzing(false)
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
              <h2 className="font-mono text-lg font-bold text-primary">
                <Link
                  href={`/cves/${encodeURIComponent(result.id)}`}
                  title="상세 페이지로 이동"
                  className="group inline-flex items-center gap-1 rounded-md border border-transparent px-1.5 py-0.5 -mx-1.5 transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-glow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  {result.id}
                  <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </h2>
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
            {result.translationFailed && (
              <p className="mt-4 text-xs text-warning">
                한국어 번역에 실패하여 영어 원문을 표시합니다.
              </p>
            )}
            <p className={result.translationFailed ? 'mt-2 text-sm leading-relaxed text-foreground' : 'mt-4 text-sm leading-relaxed text-foreground'}>
              {result.description}
            </p>
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
            <div className="mt-5 border-t border-border pt-5">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={requestAnalysis}
                  disabled={analyzing || analysisBlocked || remainingAnalyses === 0}
                  className="inline-flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Sparkles className="size-4" />
                  {analyzing ? 'AI 분석 중' : 'AI로 추가 분석하기'}
                </button>
                {remainingAnalyses !== null && (
                  <span className="text-xs text-muted-foreground">
                    오늘 남은 횟수 {remainingAnalyses}/5
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                로그인 사용자만 이용할 수 있으며 하루 5회로 제한됩니다.
              </p>
              {analysisError && (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {analysisError}
                </p>
              )}
              {analysis && (
                <div className="mt-4 space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div>
                    <h3 className="text-sm font-semibold text-primary">AI 분석 요약</h3>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">{analysis.summary}</p>
                  </div>
                  {[
                    ['공격 조건', analysis.attackConditions],
                    ['예상 영향', analysis.impact],
                    ['대응 방법', analysis.mitigations],
                  ].map(([title, items]) => (
                    <div key={title as string}>
                      <h3 className="text-xs font-semibold text-foreground">{title}</h3>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {(items as string[]).map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  ))}
                  <p className="border-t border-border pt-3 text-xs text-warning">{analysis.caution}</p>
                </div>
              )}
            </div>
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
