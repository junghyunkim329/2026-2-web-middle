import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CVES, getCve } from '@/lib/mock-data'
import { SeverityBadge, Tag, StatPill } from '@/components/cve-bits'
import {
  ArrowLeft,
  Bookmark,
  GitCompare,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  TerminalSquare,
  FileText,
} from 'lucide-react'

export function generateStaticParams() {
  return CVES.map((c) => ({ id: c.id }))
}

export default async function CveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cve = getCve(id)
  if (!cve) notFound()

  const vectorParts = cve.cvssVector.replace('CVSS:3.1/', '').split('/')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-3.5" /> 검색으로
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* main */}
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-bold text-accent text-glow sm:text-3xl">
              {cve.id}
            </h1>
            <SeverityBadge severity={cve.severity} score={cve.cvss} />
            {cve.kev && <Tag tone="destructive">CISA KEV</Tag>}
            {cve.exploitPublic && <Tag tone="warning">Exploit 공개</Tag>}
          </div>
          <h2 className="mt-3 text-pretty text-xl font-semibold text-foreground">{cve.title}</h2>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            공개 {cve.published} · 갱신 {cve.updated} · {cve.vendor}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <button className="flex items-center gap-1.5 rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20">
              <Bookmark className="size-4" /> 저장
            </button>
            <Link
              href="/compare"
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/50"
            >
              <GitCompare className="size-4" /> 비교에 추가
            </Link>
            <Link
              href={`/lab?cve=${encodeURIComponent(cve.id)}`}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/50"
            >
              <TerminalSquare className="size-4" /> 실습 열기
            </Link>
          </div>

          {/* AI analysis */}
          <section className="mt-8 rounded-xl border border-accent/30 bg-card/60 p-5 box-glow-accent">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-accent" />
              <h3 className="font-mono text-sm font-semibold text-accent">AI 취약점 분석</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground">{cve.summary}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-background/50 p-3">
                <p className="font-mono text-xs font-semibold text-primary">공격 시나리오</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  인증되지 않은 공격자가 네트워크를 통해 조작된 요청을 전송, 취약한 처리 로직을
                  악용하여 대상 시스템에서 임의 코드를 실행합니다.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background/50 p-3">
                <p className="font-mono text-xs font-semibold text-primary">권장 대응</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  최신 패치 적용을 최우선으로 하고, 불가한 경우 취약 기능 비활성화 및 WAF 규칙,
                  탐지 시그니처로 임시 완화하세요.
                </p>
              </div>
            </div>
            <p className="mt-3 font-mono text-[11px] text-muted-foreground">
              AI 생성 요약 · 로그인 사용자는 심층 분석과 탐지 규칙 생성을 이용할 수 있습니다.
            </p>
          </section>

          {/* CVSS vector */}
          <section className="mt-8">
            <h3 className="font-mono text-sm font-semibold text-foreground">CVSS 3.1 벡터</h3>
            <p className="mt-1 break-all font-mono text-xs text-accent">{cve.cvssVector}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {vectorParts.map((p) => (
                <span
                  key={p}
                  className="rounded border border-border bg-secondary px-2 py-1 font-mono text-[11px] text-muted-foreground"
                >
                  {p}
                </span>
              ))}
            </div>
          </section>

          {/* affected products */}
          <section className="mt-8">
            <h3 className="font-mono text-sm font-semibold text-foreground">영향받는 제품</h3>
            <ul className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border">
              {cve.products.map((p) => (
                <li
                  key={p}
                  className="flex items-center justify-between gap-2 bg-card px-4 py-3 text-sm"
                >
                  <span className="font-mono text-foreground">{p}</span>
                  {cve.patched ? (
                    <span className="flex items-center gap-1 text-xs text-primary">
                      <ShieldCheck className="size-4" /> 패치 제공
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-destructive">
                      <ShieldAlert className="size-4" /> 패치 대기
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* references */}
          <section className="mt-8">
            <h3 className="font-mono text-sm font-semibold text-foreground">참고 자료</h3>
            <ul className="mt-3 space-y-2 font-mono text-xs">
              {['NVD 상세', 'CISA KEV 카탈로그', '벤더 보안 권고', 'Exploit-DB'].map((r) => (
                <li key={r}>
                  <a href="#" className="text-accent underline-offset-2 hover:underline">
                    {r} ↗
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* sidebar */}
        <aside className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatPill label="CVSS" value={cve.cvss.toFixed(1)} tone="destructive" />
            <StatPill label="EPSS" value={`${(cve.epss * 100).toFixed(0)}%`} tone="warning" />
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              위협 지표
            </h3>
            <dl className="mt-3 space-y-2.5 text-sm">
              <Row label="KEV 등재" ok={cve.kev} okLabel="예" noLabel="아니오" danger />
              <Row label="Exploit 공개" ok={cve.exploitPublic} okLabel="공개됨" noLabel="비공개" danger />
              <Row label="패치 여부" ok={cve.patched} okLabel="제공" noLabel="미제공" />
            </dl>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              분류
            </h3>
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">CWE 유형</p>
                <Link
                  href={`/learn/${cve.cwe}`}
                  className="mt-1 flex items-center gap-2 font-mono text-sm text-accent hover:text-primary"
                >
                  {cve.cwe} · {cve.cweName}
                </Link>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">벤더</p>
                <p className="mt-1 font-mono text-sm text-foreground">{cve.vendor}</p>
              </div>
            </div>
          </div>

          <Link
            href="/mypage"
            className="flex items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <FileText className="size-4" /> 원데이 리포트 작성
          </Link>
        </aside>
      </div>
    </div>
  )
}

function Row({
  label,
  ok,
  okLabel,
  noLabel,
  danger,
}: {
  label: string
  ok: boolean
  okLabel: string
  noLabel: string
  danger?: boolean
}) {
  const positiveTone = danger ? 'text-destructive' : 'text-primary'
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`font-mono text-xs font-semibold ${ok ? positiveTone : 'text-muted-foreground'}`}>
        {ok ? okLabel : noLabel}
      </dd>
    </div>
  )
}
