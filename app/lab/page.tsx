'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CVES, getCve } from '@/lib/mock-data'
import { SeverityBadge } from '@/components/cve-bits'
import { cn } from '@/lib/utils'
import { Play, RotateCcw, Server, Cpu, CircleDot, Flag, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const DEFAULT_CODE = `import requests

TARGET = "http://target.lab:8080"

# CVE 실습 코드를 작성하세요
response = requests.get(TARGET)
print(response.status_code)`

const SAMPLE_OUTPUT = [
  { type: 'cmd', text: '$ python3 exploit.py --target target.lab' },
  { type: 'out', text: '[*] 격리된 실습 환경에 연결했습니다.' },
  { type: 'ok', text: '[+] 코드 실행 완료' },
  { type: 'flag', text: 'FLAG{lab_complete}' },
]

export default function LabPage() {
  const searchParams = useSearchParams()
  const cveId = searchParams.get('cve')
  const cve = useMemo(
    () => (cveId ? getCve(cveId) : undefined),
    [cveId],
  )
  const [code, setCode] = useState(DEFAULT_CODE)
  const [running, setRunning] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisDone, setAnalysisDone] = useState(false)
  const [lines, setLines] = useState<typeof SAMPLE_OUTPUT>([])

  function analyzeCode() {
    setAnalyzing(true)
    setAnalysisDone(false)
    window.setTimeout(() => {
      setAnalyzing(false)
      setAnalysisDone(true)
    }, 700)
  }

  function runCode() {
    setRunning(true)
    setLines([])
    SAMPLE_OUTPUT.forEach((line, index) => {
      setTimeout(() => {
        setLines((current) => [...current, line])
        if (index === SAMPLE_OUTPUT.length - 1) setRunning(false)
      }, (index + 1) * 450)
    })
  }

  function reset() {
    setRunning(false)
    setLines([])
    setCode(DEFAULT_CODE)
  }

  if (!cve) {
    return <LabList />
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link href={`/cve/${cve.id}`} className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-3.5" /> CVE 정보로 돌아가기
      </Link>

      <header className="mt-5 border-b border-border pb-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-bold text-accent">{cve.id}</h1>
          <SeverityBadge severity={cve.severity} score={cve.cvss} />
        </div>
        <p className="mt-2 text-lg font-semibold text-foreground">{cve.title}</p>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{cve.summary}</p>
      </header>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <span className="font-mono text-xs font-semibold text-foreground">exploit.py</span>
              <span className="text-[11px] text-muted-foreground">코드 작성</span>
            </div>
            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              spellCheck={false}
              aria-label="익스플로잇 코드"
              className="min-h-72 w-full resize-none border-0 bg-[oklch(0.1_0.01_240)] p-4 font-mono text-xs leading-relaxed text-foreground outline-none focus:ring-1 focus:ring-inset focus:ring-primary"
            />
            <div className="flex justify-end gap-2 border-t border-border p-3">
              <button onClick={reset} className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs text-foreground hover:border-accent/50">
                <RotateCcw className="size-3.5" /> 초기화
              </button>
              <button onClick={runCode} disabled={running} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60">
                <Play className="size-3.5" /> {running ? '실행 중...' : '코드 실행'}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-[oklch(0.1_0.01_240)]">
            <div className="border-b border-border bg-card px-4 py-2 font-mono text-xs text-muted-foreground">실행 결과</div>
            <div className="min-h-40 space-y-1 p-4 font-mono text-xs leading-relaxed">
              {lines.length === 0 ? <p className="text-muted-foreground"><span className="text-primary">$</span> 코드를 작성하고 실행하세요.</p> : lines.map((line, index) => (
                <p key={index} className={cn(line.type === 'ok' && 'text-primary', line.type === 'flag' && 'flex items-center gap-1.5 text-primary', line.type === 'cmd' && 'text-foreground', line.type === 'out' && 'text-muted-foreground')}>
                  {line.type === 'flag' && <Flag className="size-3.5" />}{line.text}
                </p>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <span className="font-mono text-xs font-semibold text-foreground">코드 분석</span>
              <button onClick={analyzeCode} disabled={analyzing} className="rounded-md border border-primary/40 px-2.5 py-1 text-[11px] text-primary hover:bg-primary/10 disabled:opacity-60">
                {analyzing ? '분석 중...' : '정적 분석 실행'}
              </button>
            </div>
            <div className="grid gap-3 p-4 text-xs sm:grid-cols-3">
              <AnalysisItem label="구문 검사" value={analysisDone ? '통과' : '대기'} active={analysisDone} />
              <AnalysisItem label="취약 호출" value={analysisDone ? '1건 감지' : '대기'} active={analysisDone} warning={analysisDone} />
              <AnalysisItem label="대상 연결" value={analysisDone ? '확인 필요' : '대기'} active={analysisDone} />
            </div>
            <p className="border-t border-border px-4 py-3 text-[11px] text-muted-foreground">작성한 코드의 구문과 위험한 호출을 실행 전에 확인합니다.</p>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">실습 환경</h2>
            <div className="mt-4 space-y-3">
              <Machine icon={<Server className="size-4 text-destructive" />} label="타겟" value="target.lab" />
              <Machine icon={<Cpu className="size-4 text-accent" />} label="공격자" value="kali.lab" />
            </div>
            <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">격리된 환경에서만 실행됩니다. 작성한 코드는 이 CVE 실습에 사용됩니다.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">취약점 정보</h2>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">CWE</dt><dd className="font-mono text-accent">{cve.cwe}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">CVSS</dt><dd className="font-mono text-foreground">{cve.cvss.toFixed(1)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">EPSS</dt><dd className="font-mono text-foreground">{(cve.epss * 100).toFixed(0)}%</dd></div>
            </dl>
          </div>
        </aside>
      </section>
    </main>
  )
}

function LabList() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="border-b border-border pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Practice labs</p>
        <h1 className="mt-3 text-2xl font-bold text-foreground">CVE 실습 목록</h1>
        <p className="mt-2 text-sm text-muted-foreground">실습할 CVE를 선택하세요.</p>
      </header>
      <section className="mt-6 grid grid-cols-1 gap-3">
        {CVES.map((item) => (
          <Link key={item.id} href={`/lab?cve=${item.id}`} className="group flex items-center gap-5 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/60">
            <span className="min-w-36 font-mono text-sm font-semibold text-primary">{item.id}</span>
            <span className="shrink-0"><SeverityBadge severity={item.severity} score={item.cvss} /></span>
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground group-hover:text-primary">{item.title}</p>
            <div className="flex shrink-0 gap-4 font-mono text-[11px] text-muted-foreground">
              <span>{item.cwe}</span><span>CVSS {item.cvss.toFixed(1)}</span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  )
}

function AnalysisItem({ label, value, active, warning = false }: { label: string; value: string; active: boolean; warning?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <p className="text-muted-foreground">{label}</p>
      <p className={cn('mt-1 font-mono font-semibold', active ? (warning ? 'text-amber-300' : 'text-primary') : 'text-muted-foreground')}>{value}</p>
    </div>
  )
}

function Machine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-2"><span>{icon}</span><div><p className="text-[11px] text-muted-foreground">{label}</p><p className="font-mono text-xs text-foreground">{value}</p></div><CircleDot className="ml-auto size-3 text-primary" /></div>
}

// The editor is intentionally a textarea for this wireframe; it can be replaced with a sandboxed editor/runtime later.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _editorNote = 'sandboxed editor placeholder'
