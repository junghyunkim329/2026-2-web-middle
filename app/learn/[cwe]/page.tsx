import Link from 'next/link'
import { CWES, getCwe, getCve } from '@/lib/mock-data'
import { CweReferenceView } from './cwe-reference'
import { SeverityBadge } from '@/components/cve-bits'
import { ArrowLeft, BookOpen, Circle } from 'lucide-react'

export function generateStaticParams() {
  return CWES.map((c) => ({ cwe: c.id }))
}

const CURRICULUM = [
  '개념과 발생 원리',
  '취약 코드 패턴 식별',
  '실제 CVE 사례 분석',
  '익스플로잇 재현',
  '완화 및 시큐어 코딩',
]

export default async function CweDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ cwe: string }>
  searchParams: Promise<{ cve?: string }>
}) {
  const { cwe: cweId } = await params
  const cwe = getCwe(cweId)
  if (!cwe) {
    const { cve } = await searchParams
    return <CweReferenceView id={cweId} fromCve={cve} />
  }

  const relatedCves = cwe.relatedCves.map((id) => getCve(id)).filter(Boolean)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href="/learn"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-3.5" /> 학습 목록
      </Link>

      <div className="mt-4 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xl font-bold text-accent text-glow">{cwe.id}</span>
          <span className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
            {cwe.category}
          </span>
          <span className="rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[11px] text-primary">
            {cwe.difficulty}
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-bold text-foreground">{cwe.name}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{cwe.description}</p>

        <div className="mt-5">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-muted-foreground">학습 진행률</span>
            <span className="text-muted-foreground">0%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary" />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
        <div>
          <h2 className="flex items-center gap-2 font-mono text-sm font-semibold text-foreground">
            <BookOpen className="size-4 text-primary" /> 커리큘럼
          </h2>
          <ol className="mt-4 space-y-2">
            {CURRICULUM.map((title, i) => (
              <li key={title} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                <Circle className="size-5 shrink-0 text-muted-foreground" />
                <span className="font-mono text-xs text-muted-foreground">{`0${i + 1}`}</span>
                <span className="flex-1 text-sm text-muted-foreground">{title}</span>
              </li>
            ))}
          </ol>

          <h2 className="mt-8 flex items-center gap-2 font-mono text-sm font-semibold text-foreground">
            관련 CVE 사례
          </h2>
          <div className="mt-4 space-y-2">
            {relatedCves.length === 0 && (
              <p className="text-sm text-muted-foreground">연결된 CVE 예시가 없습니다.</p>
            )}
            {relatedCves.map((c) => (
              <Link
                key={c!.id}
                href={`/cve/${c!.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-accent/50"
              >
                <div className="min-w-0">
                  <span className="font-mono text-xs font-bold text-accent">{c!.id}</span>
                  <p className="truncate text-xs text-muted-foreground">{c!.title}</p>
                </div>
                <SeverityBadge severity={c!.severity} score={c!.cvss} />
              </Link>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              구성
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <BookOpen className="size-4" /> 강의
                </span>
                <span className="font-mono text-foreground">{cwe.lessons}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
