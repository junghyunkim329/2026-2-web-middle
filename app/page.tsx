import Link from 'next/link'
import { AiSearch } from '@/components/ai-search'
import { CveCard } from '@/components/cve-bits'
import { CVES, CWES } from '@/lib/mock-data'
import { ArrowRight, BookOpen, GitCompare, MessageSquare, TerminalSquare } from 'lucide-react'

const FEATURES = [
  {
    href: '/learn',
    icon: BookOpen,
    title: 'CWE 기반 학습',
    desc: 'CWE 학습',
  },
  {
    href: '/lab',
    icon: TerminalSquare,
    title: '실습 랩',
    desc: '취약점 실습',
  },
  {
    href: '/compare',
    icon: GitCompare,
    title: 'CVE 비교',
    desc: 'CVE 비교',
  },
  {
    href: '/qna',
    icon: MessageSquare,
    title: '질의응답',
    desc: '커뮤니티 Q&A',
  },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-xs text-accent">
            <span className="size-1.5 rounded-full bg-accent" />
            AI 기반 취약점 인텔리전스
          </span>
          <h1 className="mt-6 text-balance font-mono text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl">
            <span className="text-primary text-glow">CVE</span>를 검색하세요
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
            CVE 번호 검색
          </p>

          <div className="mt-10">
            <AiSearch />
          </div>

        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group flex items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-4 transition-colors hover:border-primary/50"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <f.icon className="size-4" />
              </span>
              <span className="min-w-0">
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{f.desc}</p>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending CVEs */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-mono text-2xl font-bold text-foreground">주요 취약점</h2>
          </div>
          <Link
            href="/compare"
            className="hidden items-center gap-1 font-mono text-sm text-accent hover:text-primary sm:flex"
          >
            전체 비교 <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CVES.slice(0, 6).map((cve) => (
            <CveCard key={cve.id} cve={cve} />
          ))}
        </div>
      </section>

      {/* Learning tracks */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="font-mono text-2xl font-bold text-foreground">CWE 학습 트랙</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CWES.slice(0, 3).map((cwe) => (
              <Link
                key={cwe.id}
                href={`/learn/${cwe.id}`}
                className="group flex flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-accent/50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-accent">{cwe.id}</span>
                  <span className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                    {cwe.difficulty}
                  </span>
                </div>
                <h3 className="mt-2 font-semibold text-foreground">{cwe.name}</h3>
                <div className="mt-4 flex gap-4 border-t border-border pt-3 font-mono text-[11px] text-muted-foreground">
                  <span>강의 {cwe.lessons}</span>
                  <span>랩 {cwe.labs}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
