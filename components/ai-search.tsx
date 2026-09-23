'use client'

import { useState } from 'react'
import Link from 'next/link'

const CVE_PATTERN = /^CVE-\d{4}-\d{4,}$/i
import { Search, Sparkles, Loader2, Lock, Terminal } from 'lucide-react'
import { CVES } from '@/lib/mock-data'
import { SeverityBadge } from '@/components/cve-bits'

export function AiSearch() {
  const [query, setQuery] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [error, setError] = useState('')

  const results = CVES.slice(0, 3)

  function run(q: string) {
    const normalized = q.trim().toUpperCase()
    if (!CVE_PATTERN.test(normalized)) {
      setError('CVE 번호 형식으로 입력해주세요. 예: CVE-2024-3094')
      setState('idle')
      return
    }
    setError('')
    setQuery(normalized)
    setState('loading')
    setTimeout(() => setState('done'), 1300)
  }

  return (
    <div className="w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          run(query)
        }}
        className="relative"
      >
        <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-card/80 p-2 box-glow">
          <Search className="ml-2 size-5 shrink-0 text-primary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="CVE 번호 입력 — 예: CVE-2024-3094"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={state === 'loading'}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {state === 'loading' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            AI 분석
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-2 font-mono text-xs text-destructive">
            {error}
          </p>
        )}
      </form>

      {state !== 'idle' && (
        <div className="mt-6 rounded-xl border border-accent/30 bg-card/60 p-4 box-glow-accent">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Terminal className="size-4 text-accent" />
            <span className="font-mono text-xs font-semibold text-accent">
              AI 분석 결과
            </span>
            <span className="ml-auto flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
              <Lock className="size-3" />
              로그인 사용자 전용 · 오늘 12/20회
            </span>
          </div>

          {state === 'loading' ? (
            <div className="space-y-2 py-4">
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
              <p className="pt-2 font-mono text-xs text-muted-foreground">
                <span className="animate-pulse">▍</span> NVD · EPSS · KEV 데이터 상관분석 중...
              </p>
            </div>
          ) : (
            <div className="py-3">
              <p className="text-sm text-foreground">
                <span className="font-mono text-primary">&gt;</span> {query} 분석 결과
              </p>
              <div className="mt-4 space-y-2">
                {results.map((cve) => (
                  <Link
                    key={cve.id}
                    href={`/cve/${cve.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-2.5 transition-colors hover:border-primary/50"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-accent">{cve.id}</span>
                        <SeverityBadge severity={cve.severity} score={cve.cvss} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{cve.title}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                      EPSS {(cve.epss * 100).toFixed(0)}%
                    </span>
                  </Link>
                ))}
              </div>
              <Link
                href={`/cves?search=${encodeURIComponent(query)}`}
                className="mt-3 block text-center font-mono text-xs text-primary transition-colors hover:text-foreground"
              >
                CVE 목록에서 더 보기
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
