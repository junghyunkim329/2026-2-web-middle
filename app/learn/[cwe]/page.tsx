import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getCwe, getCve } from '@/lib/mock-data'
import { CweReferenceView } from './cwe-reference'
import { SeverityBadge } from '@/components/cve-bits'
import { getCurriculum, type LessonCode } from '@/lib/curriculum'
import { ArrowLeft, BookOpen, ChevronDown, Circle } from 'lucide-react'

const CODE_STYLE: Record<LessonCode['nature'], string> = {
  bad: 'border-destructive/40 text-destructive',
  good: 'border-primary/40 text-primary',
  other: 'border-border text-muted-foreground',
}

export default async function CweDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ cwe: string }>
  searchParams: Promise<{ cve?: string }>
}) {
  const [{ cwe: cweId }, { cve }, user] = await Promise.all([params, searchParams, getCurrentUser()])
  if (!user) {
    const query = cve && /^CVE-\d{4}-\d{4,}$/i.test(cve) ? `?cve=${encodeURIComponent(cve)}` : ''
    redirect(`/login?next=${encodeURIComponent(`/learn/${encodeURIComponent(cweId)}${query}`)}`)
  }

  const cwe = getCwe(cweId)
  if (!cwe) {
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

      <div className="mt-8">
        <div>
          <h2 className="flex items-center gap-2 font-mono text-sm font-semibold text-foreground">
            <BookOpen className="size-4 text-primary" /> 커리큘럼
          </h2>
          <ol className="mt-4 space-y-2">
            {getCurriculum(cwe.id).map((lesson, i) => (
              <li key={lesson.title}>
                <details className="group rounded-lg border border-border bg-card open:border-primary/30">
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                    <Circle className="size-5 shrink-0 text-muted-foreground" />
                    <span className="font-mono text-xs text-muted-foreground">{`0${i + 1}`}</span>
                    <span className="flex-1 text-sm text-muted-foreground group-open:text-foreground">{lesson.title}</span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="space-y-4 border-t border-border px-4 py-4">
                    {lesson.summary && <p className="text-sm leading-relaxed text-foreground">{lesson.summary}</p>}
                    {lesson.points.length > 0 && (
                      <ul className="space-y-1.5">
                        {lesson.points.map((point) => (
                          <li key={point} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                            <span className="text-primary">›</span>
                            <span className="min-w-0 break-words">{point}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {lesson.code?.map((block) => (
                      <div key={block.label}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`rounded border px-2 py-0.5 font-mono text-[11px] ${CODE_STYLE[block.nature]}`}>
                            {block.label}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground">{block.language}</span>
                        </div>
                        <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-background p-3 font-mono text-xs leading-relaxed text-foreground">
                          <code>{block.code}</code>
                        </pre>
                      </div>
                    ))}
                    {!lesson.summary && <p className="text-sm text-muted-foreground">강의 내용을 준비 중이에요.</p>}
                  </div>
                </details>
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
      </div>
    </div>
  )
}
