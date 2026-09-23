import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CWES, getCwe, getCve } from '@/lib/mock-data'
import { SeverityBadge } from '@/components/cve-bits'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  FlaskConical,
  PlayCircle,
} from 'lucide-react'

export function generateStaticParams() {
  return CWES.map((c) => ({ cwe: c.id }))
}

const CURRICULUM = [
  { title: '개념과 발생 원리', done: true },
  { title: '취약 코드 패턴 식별', done: true },
  { title: '실제 CVE 사례 분석', done: false },
  { title: '익스플로잇 재현', done: false },
  { title: '완화 및 시큐어 코딩', done: false },
]

export default async function CweDetailPage({
  params,
}: {
  params: Promise<{ cwe: string }>
}) {
  const { cwe: cweId } = await params
  const cwe = getCwe(cweId)
  if (!cwe) notFound()

  const relatedCves = cwe.relatedCves.map((id) => getCve(id)).filter(Boolean)
  const progress = CURRICULUM.filter((c) => c.done).length
  const pct = Math.round((progress / CURRICULUM.length) * 100)

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
            <span className="text-primary">{pct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary box-glow" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
        <div>
          <h2 className="flex items-center gap-2 font-mono text-sm font-semibold text-foreground">
            <BookOpen className="size-4 text-primary" /> 커리큘럼
          </h2>
          <ol className="mt-4 space-y-2">
            {CURRICULUM.map((step, i) => (
              <li
                key={step.title}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
              >
                {step.done ? (
                  <CheckCircle2 className="size-5 shrink-0 text-primary" />
                ) : (
                  <Circle className="size-5 shrink-0 text-muted-foreground" />
                )}
                <span className="font-mono text-xs text-muted-foreground">{`0${i + 1}`}</span>
                <span
                  className={`flex-1 text-sm ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  {step.title}
                </span>
                {!step.done && i === progress && (
                  <span className="flex items-center gap-1 font-mono text-[11px] text-accent">
                    <PlayCircle className="size-3.5" /> 이어서
                  </span>
                )}
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
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <FlaskConical className="size-4" /> 실습 랩
                </span>
                <span className="font-mono text-foreground">{cwe.labs}</span>
              </div>
            </div>
          </div>

          <Link
            href="/lab"
            className="flex items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <FlaskConical className="size-4" /> 실습 랩 시작
          </Link>
        </aside>
      </div>
    </div>
  )
}
