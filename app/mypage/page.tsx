'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { SAVED_CVES, REPORTS, getCve } from '@/lib/mock-data'
import { SeverityBadge, StatPill } from '@/components/cve-bits'
import { cn } from '@/lib/utils'
import {
  Bookmark,
  FileText,
  Sparkles,
  Trash2,
  Plus,
  Gauge,
  User,
} from 'lucide-react'

type Tab = 'saved' | 'reports' | 'usage'

const TABS: { id: Tab; label: string; icon: typeof Bookmark }[] = [
  { id: 'saved', label: '저장 · 즐겨찾기', icon: Bookmark },
  { id: 'reports', label: '원데이 리포트', icon: FileText },
  { id: 'usage', label: 'AI 사용량', icon: Gauge },
]

export default function MyPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('saved')

  useEffect(() => {
    if (document.cookie.indexOf('cvehub_session=1') === -1) {
      router.replace('/login?next=/mypage')
    }
  }, [router])

  if (typeof document !== 'undefined' && document.cookie.indexOf('cvehub_session=1') === -1) {
    return null
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* profile header */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-5">
        <span className="flex size-14 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
          <User className="size-7" />
        </span>
        <div>
          <h1 className="font-mono text-lg font-bold text-foreground">sec_analyst</h1>
          <p className="text-sm text-muted-foreground">you@example.com · Free 플랜</p>
        </div>
        <div className="ml-auto grid grid-cols-3 gap-2">
          <StatPill label="저장" value={String(SAVED_CVES.length)} tone="primary" />
          <StatPill label="리포트" value={String(REPORTS.length)} tone="accent" />
          <StatPill label="AI 오늘" value="12/20" tone="warning" />
        </div>
      </div>

      {/* tabs */}
      <div className="mt-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <t.icon className="size-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'saved' && <SavedTab />}
        {tab === 'reports' && <ReportsTab />}
        {tab === 'usage' && <UsageTab />}
      </div>
    </div>
  )
}

function SavedTab() {
  return (
    <div className="space-y-3">
      {SAVED_CVES.map((s) => {
        const cve = getCve(s.id)
        if (!cve) return null
        return (
          <div
            key={s.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4"
          >
            <Bookmark className="size-4 text-primary" />
            <Link
              href={`/cve/${cve.id}`}
              className="font-mono text-sm font-bold text-accent hover:text-primary"
            >
              {cve.id}
            </Link>
            <SeverityBadge severity={cve.severity} score={cve.cvss} />
            <p className="w-full text-xs text-muted-foreground sm:w-auto sm:flex-1">
              메모: {s.note}
            </p>
            <span className="font-mono text-[11px] text-muted-foreground">{s.savedAt}</span>
            <button
              className="text-muted-foreground transition-colors hover:text-destructive"
              aria-label="삭제"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

function ReportsTab() {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [generating, setGenerating] = useState(false)

  function generate() {
    setGenerating(true)
    setDraft('')
    const text =
      '## 개요\n대상 CVE는 원격 코드 실행이 가능한 치명적 취약점으로 KEV에 등재되어 있습니다.\n\n## 영향 범위\n- 영향 제품 및 버전 정리\n- 노출 자산 스캔 결과\n\n## 재현 절차\n1. 취약 엔드포인트 식별\n2. 페이로드 구성 및 전송\n3. 코드 실행 확인\n\n## 대응 방안\n- 최신 패치 적용 (최우선)\n- 임시 완화: 취약 기능 비활성화, WAF 규칙 적용\n- 탐지: 관련 IOC 및 시그니처 배포'
    let i = 0
    const timer = setInterval(() => {
      i += 8
      setDraft(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(timer)
        setGenerating(false)
      }
    }, 30)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          CVE별 원데이 분석 리포트. AI가 초안을 생성해줍니다.
        </p>
        <button
          onClick={() => setEditing((v) => !v)}
          className="flex items-center gap-1.5 rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <Plus className="size-4" /> 새 리포트
        </button>
      </div>

      {editing && (
        <div className="mt-4 rounded-lg border border-accent/30 bg-card p-4 box-glow-accent">
          <div className="flex items-center justify-between gap-2">
            <input
              placeholder="리포트 제목 (예: CVE-2024-3094 원데이 분석)"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
            <button
              onClick={generate}
              disabled={generating}
              className="flex shrink-0 items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <Sparkles className="size-4" /> {generating ? '생성 중...' : 'AI 초안 생성'}
            </button>
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={12}
            placeholder="마크다운으로 작성하거나 AI 초안 생성 버튼을 눌러보세요."
            className="mt-3 w-full rounded-md border border-input bg-background p-3 font-mono text-xs leading-relaxed outline-none focus:border-primary/60"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setEditing(false)}
              className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground"
            >
              취소
            </button>
            <button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
              저장
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {REPORTS.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4"
          >
            <FileText className="size-4 text-accent" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {r.cve} · 갱신 {r.updatedAt}
              </p>
            </div>
            <ReportStatus status={r.status} />
          </div>
        ))}
      </div>
    </div>
  )
}

function ReportStatus({ status }: { status: string }) {
  const tone =
    status === '완료'
      ? 'text-primary border-primary/40 bg-primary/10'
      : status === 'AI 검토'
        ? 'text-accent border-accent/40 bg-accent/10'
        : 'text-warning border-warning/40 bg-warning/10'
  return (
    <span className={cn('rounded border px-2 py-0.5 font-mono text-[11px]', tone)}>{status}</span>
  )
}

function UsageTab() {
  const used = 12
  const limit = 20
  const pct = (used / limit) * 100

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-border bg-card p-5 sm:col-span-2">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-mono text-sm font-semibold text-foreground">
            <Gauge className="size-4 text-warning" /> 오늘의 AI 사용량
          </h3>
          <span className="font-mono text-sm text-warning">
            {used} / {limit} 회
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-warning"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
          매일 자정(KST)에 초기화됩니다. Free 플랜은 일일 {limit}회 제한.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          기능별 사용
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {[
            { k: 'CVE 검색·분석', v: 7 },
            { k: '리포트 초안 생성', v: 3 },
            { k: '탐지 규칙 생성', v: 2 },
          ].map((row) => (
            <li key={row.k} className="flex items-center justify-between">
              <span className="text-muted-foreground">{row.k}</span>
              <span className="font-mono text-foreground">{row.v}회</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col justify-between rounded-lg border border-primary/30 bg-primary/5 p-5">
        <div>
          <p className="font-mono text-sm font-semibold text-primary">Pro 플랜</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            일일 AI 사용 한도 200회, 심층 분석과 우선 실습 랩 이용.
          </p>
        </div>
        <button className="mt-4 rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
          업그레이드
        </button>
      </div>
    </div>
  )
}
