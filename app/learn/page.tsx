'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CWES } from '@/lib/mock-data'
import { BookOpen, FlaskConical, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORIES = ['전체', '인젝션', '메모리 안전', '데이터 처리', '권한 관리']

export default function LearnPage() {
  const [cat, setCat] = useState('전체')

  const filtered = cat === '전체' ? CWES : CWES.filter((c) => c.category === cat)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-2">
        <BookOpen className="size-5 text-primary" />
        <h1 className="font-mono text-2xl font-bold text-foreground">취약점 학습 · CWE</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        CWE 유형별로 개념을 학습하고 관련 CVE와 실습으로 연결됩니다.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              cat === c
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-border bg-secondary text-muted-foreground hover:text-foreground',
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {filtered.map((cwe) => (
          <Link
            key={cwe.id}
            href={`/learn/${cwe.id}`}
            className="group grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-4 rounded-lg border border-border bg-card px-4 py-2.5 transition-colors hover:border-accent/50"
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
              <span className="flex items-center gap-1">
                <FlaskConical className="size-3.5" /> {cwe.labs}
              </span>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </div>
  )
}
