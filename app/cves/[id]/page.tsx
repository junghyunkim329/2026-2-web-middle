// app/cves/[id]/page.tsx — 새 CVE 상세 페이지 (/cves/CVE-xxxx-xxxx, NVD 데이터 기반)
import { cache, Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ExternalLink,
  FileText,
  GitCompare,
  Link2,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { FavoriteButton } from '@/components/favorite-button'
import { Tag } from '@/components/cve-bits'
import { getNvdCve } from '@/lib/nvd'
import { parseCvssVector, severityStyle, toSeverity, type CvssMetricItem } from '@/lib/cvss'
import { WeaknessChip } from '@/components/weakness-chip'
import { getCwe, type Cwe } from '@/lib/mock-data'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SourceSection, SourceSectionSkeleton } from './source-section'

const loadCve = cache(getNvdCve)

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const lookup = await loadCve(id)
  if (!lookup.ok) return { title: 'CVE 상세 | CVEHUB' }
  return {
    title: `${lookup.cve.id} | CVEHUB`,
    description: lookup.cve.description.slice(0, 150),
  }
}

export default async function CveDetailPage({ params }: PageProps) {
  const { id } = await params
  const lookup = await loadCve(id)

  if (!lookup.ok) {
    if (lookup.status === 400 || lookup.status === 404) notFound()
    return <LookupError message={lookup.error} />
  }

  const cve = lookup.cve
  const score = cve.cvss?.score ?? null
  const severity = toSeverity(cve.cvss?.severity, score)
  const style = severityStyle[severity]
  const metrics = parseCvssVector(cve.cvss?.vector)
  const references = [...new Map(cve.references.map((r) => [r.url, r])).values()]
  const nvdUrl = `https://nvd.nist.gov/vuln/detail/${encodeURIComponent(cve.id)}`
  const learnable = [...new Set(cve.weaknesses)].map((w) => getCwe(w)).filter((c): c is Cwe => !!c)

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 grid-bg opacity-30" />
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-3.5" /> 검색으로 돌아가기
        </Link>

        <header className="mt-6 border-b border-border pb-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-3xl font-bold tracking-tight text-primary text-glow sm:text-4xl">
              {cve.id}
            </h1>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-xs font-semibold',
                style.badge,
              )}
            >
              {severity}
              {score !== null && <span className="opacity-80">{score.toFixed(1)}</span>}
            </span>
            {cve.status && <Tag>{cve.status}</Tag>}
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" /> 공개 {formatDate(new Date(cve.published))}
            </span>
            <span>최종 수정 {formatDate(new Date(cve.lastModified))}</span>
            <span>출처 NVD</span>
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <FavoriteButton cveId={cve.id} />
            <ActionLink href="/compare" icon={<GitCompare className="size-4" />}>
              비교에 추가
            </ActionLink>
            <ActionLink
              href={learnable.length > 0 ? `/learn/${learnable[0].id}` : '/learn'}
              icon={<BookOpen className="size-4" />}
            >
              {learnable.length > 0 ? `${learnable[0].id} 학습하기` : '취약점 학습'}
            </ActionLink>
            <a
              href={nvdUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              <ExternalLink className="size-4" /> NVD 원문
            </a>
          </div>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0 space-y-8">
            <Section title="취약점 개요">
              <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
                <p className="text-sm leading-relaxed text-foreground sm:text-base">{cve.description}</p>
              </div>
            </Section>

            <Section title="AI 취약점 분석">
              <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <p className="font-mono text-sm font-semibold text-primary">준비 중</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  공격 시나리오, 영향 범위, 권장 대응 방안을 한국어로 요약해 이 영역에 보여줄 예정입니다.
                </p>
              </div>
            </Section>

            <Section title="실습용 소스 코드">
              <Suspense fallback={<SourceSectionSkeleton />}>
                <SourceSection cveId={cve.id} />
              </Suspense>
            </Section>

            <Section
              title={`CVSS ${cve.cvss?.version ?? ''} 벡터`.trim()}
              aside={cve.cvss?.vector && <span className="break-all font-mono text-[11px] text-primary">{cve.cvss.vector}</span>}
            >
              {metrics.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {metrics.map((m) => (
                    <MetricRow key={m.raw} metric={m} />
                  ))}
                </div>
              ) : (
                <Empty>CVSS 벡터 정보가 아직 제공되지 않았습니다.</Empty>
              )}
            </Section>

            <Section title="관련 약점 (CWE)">
              {cve.weaknesses.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {[...new Set(cve.weaknesses)].map((w) => (
                    <WeaknessChip key={w} id={w} />
                  ))}
                </div>
              ) : (
                <Empty>등록된 CWE 정보가 없습니다.</Empty>
              )}
            </Section>

            <Section title="참고 자료">
              {references.length > 0 ? (
                <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                  {references.map((r) => (
                    <li key={r.url}>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-3 bg-card px-4 py-3 transition-colors hover:bg-secondary"
                      >
                        <Link2 className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-xs font-semibold text-foreground group-hover:text-primary">
                            {hostname(r.url)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{r.url}</p>
                        </div>
                        <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>등록된 참고 자료가 없습니다.</Empty>
              )}
            </Section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-xl border border-primary/30 bg-card p-5">
              <h3 className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <BookOpen className="size-3.5 text-primary" /> 취약점 학습
              </h3>
              {learnable.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {learnable.map((cwe) => (
                    <li key={cwe.id}>
                      <Link
                        href={`/learn/${cwe.id}`}
                        className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-background/50 px-3 py-2.5 transition-colors hover:border-primary/50"
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-semibold text-primary">{cwe.id}</p>
                          <p className="truncate text-sm text-foreground">{cwe.name}</p>
                        </div>
                        <span className="shrink-0 font-mono text-[11px] text-primary transition-transform group-hover:translate-x-0.5">
                          학습하기 →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <p className="mt-3 text-sm text-muted-foreground">이 CVE의 약점 유형은 아직 학습 페이지가 없어요.</p>
                  <Link
                    href="/learn"
                    className="mt-3 inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                  >
                    전체 학습 목록 보기 →
                  </Link>
                </>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">CVSS 기본 점수</p>
              <div className="mt-2 flex items-end gap-2">
                <span className={cn('font-mono text-5xl font-bold leading-none', style.text)}>
                  {score !== null ? score.toFixed(1) : '—'}
                </span>
                <span className="pb-1 font-mono text-sm text-muted-foreground">/ 10</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                <div className={cn('h-full rounded-full', style.bar)} style={{ width: `${(score ?? 0) * 10}%` }} />
              </div>
              <p className={cn('mt-3 flex items-center gap-1.5 text-sm font-semibold', style.text)}>
                <ShieldAlert className="size-4" /> 위험도 {style.label}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">기본 정보</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <InfoRow label="CVE ID" value={cve.id} />
                <InfoRow label="CVSS 버전" value={cve.cvss?.version ?? '-'} />
                <InfoRow label="상태" value={cve.status ?? '-'} />
                <InfoRow label="공개일" value={formatDate(new Date(cve.published))} />
                <InfoRow label="최종 수정" value={formatDate(new Date(cve.lastModified))} />
              </dl>
            </div>

            <Link
              href={`/reports/new?cve=${encodeURIComponent(cve.id)}`}
              className="flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <FileText className="size-4" /> 원데이 리포트 작성
            </Link>
          </aside>
        </div>
      </div>
    </div>
  )
}

function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 font-mono text-sm font-semibold text-foreground">
          <span className="h-3.5 w-1 rounded-full bg-primary" />
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function ActionLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
    >
      {icon} {children}
    </Link>
  )
}

function MetricRow({ metric }: { metric: CvssMetricItem }) {
  const tone = {
    high: 'border-destructive/40 bg-destructive/10 text-destructive',
    mid: 'border-warning/40 bg-warning/10 text-warning',
    low: 'border-border bg-secondary text-muted-foreground',
  }[metric.risk]
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm text-foreground">{metric.label}</p>
        <p className="font-mono text-[11px] text-muted-foreground">{metric.raw}</p>
      </div>
      <span className={cn('shrink-0 rounded border px-2 py-0.5 font-mono text-xs font-semibold', tone)}>
        {metric.value}
      </span>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-mono text-xs text-foreground">{value}</dd>
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  )
}

function LookupError({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <ShieldAlert className="mx-auto size-10 text-destructive" />
      <h1 className="mt-4 font-mono text-xl font-bold text-foreground">CVE 정보를 불러오지 못했습니다</h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/50 hover:text-primary"
      >
        <ArrowLeft className="size-4" /> 검색으로 돌아가기
      </Link>
    </div>
  )
}

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
