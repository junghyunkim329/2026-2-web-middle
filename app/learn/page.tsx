// app/learn/page.tsx — 취약점 학습 목록 (CWE 번호·이름·설명 검색, 목록에 없는 CWE 번호는 MITRE 기반 학습 페이지로 연결)
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CWES } from '@/lib/mock-data'
import { ArrowRight, BookOpen, Search, X } from 'lucide-react'

function cweIdFromQuery(query: string) {
  const match = query.trim().match(/^(?:cwe[-\s]?)?(\d{1,4})$/i)
  return match ? `CWE-${Number(match[1])}` : null
}

export default function LearnPage() {
  const [query, setQuery] = useState('')
  const keyword = query.trim().toLowerCase()
  const numberId = cweIdFromQuery(query)

  const filtered = keyword
    ? CWES.filter((c) =>
        numberId
          ? c.id === numberId
          : [c.id, c.name, c.description, c.category].some((text) => text.toLowerCase().includes(keyword)),
      )
    : CWES
  const showMitreLink = numberId !== null && filtered.length === 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-2">
        <BookOpen className="size-5 text-primary" />
        <h1 className="font-mono text-2xl font-bold text-foreground">취약점 학습 · CWE</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        CWE 유형별로 개념을 학습하고 관련 CVE로 연결됩니다.
      </p>

      <label className="relative mt-6 block max-w-xl">
        <span className="sr-only">CWE 검색</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="CWE 번호나 이름으로 검색 (예: 79, SQL Injection)"
          autoComplete="off"
          className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="검색어 지우기"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground transition-colors hover:text-primary"
          >
            <X className="size-4" />
          </button>
        )}
      </label>
      {keyword && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          검색 결과 {filtered.length + (showMitreLink ? 1 : 0)}개
        </p>
      )}

      <div className="mt-6 space-y-2">
        {filtered.map((cwe) => (
          <Link
            key={cwe.id}
            href={`/learn/${cwe.id}`}
            className="group grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-4 rounded-lg border border-border bg-card px-4 py-2.5 transition-colors hover:border-accent/50 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto]"
          >
            <span className="shrink-0 font-mono text-sm font-bold text-accent group-hover:text-primary">
              {cwe.id}
            </span>
            <h3 className="min-w-0 flex-1 truncate font-semibold text-foreground">{cwe.name}</h3>
            <span className="hidden shrink-0 rounded border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground sm:inline">
              {cwe.difficulty}
            </span>
            <div className="flex shrink-0 gap-3 font-mono text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="size-3.5" /> {cwe.lessons}
              </span>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          </Link>
        ))}

        {showMitreLink && (
          <Link
            href={`/learn/${numberId}`}
            className="group flex items-center gap-4 rounded-lg border border-dashed border-primary/40 bg-card px-4 py-3 transition-colors hover:border-primary"
          >
            <span className="shrink-0 font-mono text-sm font-bold text-accent group-hover:text-primary">{numberId}</span>
            <span className="min-w-0 flex-1 text-sm text-muted-foreground">
              준비된 강의는 없지만 MITRE 공식 자료로 학습할 수 있어요.
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          </Link>
        )}

        {filtered.length === 0 && !showMitreLink && (
          <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
            <p className="text-sm text-foreground">‘{query.trim()}’에 맞는 학습 항목이 없어요.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              CWE 번호(예: CWE-506)로 검색하면 MITRE 공식 자료로 학습할 수 있어요.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
