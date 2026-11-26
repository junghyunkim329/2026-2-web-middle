'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CVES, getCve } from '@/lib/mock-data'
import { SeverityBadge } from '@/components/cve-bits'
import { cn } from '@/lib/utils'
import { ANALYZE_CODE, buildSetupCode, getLab, LABS, type LabDefinition } from '@/lib/labs/python-env'
import { createFlag, PythonLabRunner, type CodeAnalysis } from '@/lib/labs/pyodide-runner'
import { Play, RotateCcw, Server, Cpu, CircleDot, Flag, ArrowLeft, Lightbulb, Target } from 'lucide-react'
import Link from 'next/link'

const RUN_TIMEOUT_MS = 10_000

type OutputLine = { type: 'cmd' | 'out' | 'err' | 'info' | 'ok' | 'fail' | 'flag'; text: string }

export default function LabContent() {
  const searchParams = useSearchParams()
  const cveId = searchParams.get('cve')
  const cve = useMemo(() => (cveId ? getCve(cveId) : undefined), [cveId])
  const lab = cve ? getLab(cve.id) : undefined

  if (!cve) return <LabList />
  if (!lab) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <BackLink cveId={cve.id} />
        <div className="mt-6 rounded-lg border border-border bg-card p-6">
          <h1 className="font-mono text-xl font-bold text-accent">{cve.id}</h1>
          <p className="mt-2 text-sm text-foreground">{cve.title}</p>
          <p className="mt-4 text-sm text-muted-foreground">이 CVE는 아직 실습 환경이 준비되지 않았어요.</p>
          <Link href="/lab" className="mt-4 inline-block text-xs text-primary hover:underline">
            실습 가능한 CVE 보기
          </Link>
        </div>
      </main>
    )
  }
  return <LabWorkspace key={lab.cveId} lab={lab} cve={cve} />
}

function LabWorkspace({ lab, cve }: { lab: LabDefinition; cve: NonNullable<ReturnType<typeof getCve>> }) {
  const runnerRef = useRef<PythonLabRunner | null>(null)
  const [code, setCode] = useState(lab.defaultCode)
  const [running, setRunning] = useState(false)
  const [lines, setLines] = useState<OutputLine[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null)
  const [analysisError, setAnalysisError] = useState('')
  const [hintCount, setHintCount] = useState(0)

  useEffect(() => {
    const runner = new PythonLabRunner()
    runnerRef.current = runner
    return () => {
      runner.dispose()
      runnerRef.current = null
    }
  }, [])

  const push = (line: OutputLine) => setLines((current) => [...current, line])

  async function runCode() {
    const runner = runnerRef.current
    if (!runner || running) return
    setRunning(true)
    setLines([
      { type: 'cmd', text: '$ python3 exploit.py' },
      { type: 'info', text: '[*] Python 환경과 실습 서버를 준비하는 중...' },
    ])
    const flag = createFlag()
    let stdout = ''
    const result = await runner.run({
      setup: buildSetupCode(lab, flag),
      code,
      packages: lab.packages,
      timeoutMs: RUN_TIMEOUT_MS,
      onStarted: () => setLines((current) => current.filter((line) => line.type !== 'info')),
      onOutput: (stream, text) => {
        if (stream === 'stdout') stdout += text + '\n'
        push({ type: stream === 'stdout' ? 'out' : 'err', text })
      },
    })
    setLines((current) => current.filter((line) => line.type !== 'info'))
    if (result.status === 'timeout') push({ type: 'err', text: `[!] ${RUN_TIMEOUT_MS / 1000}초 안에 끝나지 않아 실행을 중단했어요.` })
    if (result.status === 'error') push({ type: 'err', text: result.message })
    if (stdout.includes(flag)) {
      push({ type: 'flag', text: `실습 성공! 출력에서 FLAG를 확인했어요: ${flag}` })
    } else if (result.status === 'done') {
      push({ type: 'fail', text: '[-] 실행은 끝났지만 출력에서 FLAG를 찾지 못했어요.' })
    }
    setRunning(false)
  }

  async function analyzeCode() {
    const runner = runnerRef.current
    if (!runner || analyzing) return
    setAnalyzing(true)
    setAnalysisError('')
    try {
      setAnalysis(await runner.analyze(code, ANALYZE_CODE))
    } catch (error) {
      setAnalysis(null)
      setAnalysisError(error instanceof Error ? error.message : '분석에 실패했어요.')
    } finally {
      setAnalyzing(false)
    }
  }

  function reset() {
    setCode(lab.defaultCode)
    setLines([])
    setAnalysis(null)
    setAnalysisError('')
  }

  const knownHosts = lab.hosts.map((host) => host.name)
  const syntax = analysis?.syntax
  const parsed = analysis?.syntax.ok ? analysis : null
  const usedHosts = parsed?.hosts ?? []
  const unknownHosts = usedHosts.filter((host) => !knownHosts.includes(host))

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <BackLink cveId={cve.id} />

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
          <div className="rounded-lg border border-primary/30 bg-card p-4">
            <p className="flex items-center gap-2 font-mono text-xs font-semibold text-primary">
              <Target className="size-4" /> 실습 목표
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{lab.goal}</p>
            <div className="mt-3 space-y-1.5">
              {lab.hints.slice(0, hintCount).map((hint, index) => (
                <p key={index} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                  <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-amber-300" />
                  <span className="font-mono">{hint}</span>
                </p>
              ))}
              {hintCount < lab.hints.length && (
                <button
                  type="button"
                  onClick={() => setHintCount((count) => count + 1)}
                  className="text-[11px] text-primary hover:underline"
                >
                  힌트 보기 ({hintCount + 1}/{lab.hints.length})
                </button>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <span className="font-mono text-xs font-semibold text-foreground">exploit.py</span>
              <span className="text-[11px] text-muted-foreground">Python 3.12 · 브라우저에서 실행</span>
            </div>
            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Tab') {
                  event.preventDefault()
                  const el = event.currentTarget
                  const { selectionStart, selectionEnd } = el
                  const next = code.slice(0, selectionStart) + '    ' + code.slice(selectionEnd)
                  setCode(next)
                  requestAnimationFrame(() => el.setSelectionRange(selectionStart + 4, selectionStart + 4))
                }
              }}
              spellCheck={false}
              aria-label="익스플로잇 코드"
              className="min-h-72 w-full resize-y border-0 bg-[oklch(0.1_0.01_240)] p-4 font-mono text-xs leading-relaxed text-foreground outline-none focus:ring-1 focus:ring-inset focus:ring-primary"
            />
            <div className="flex justify-end gap-2 border-t border-border p-3">
              <button onClick={reset} disabled={running} className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs text-foreground hover:border-accent/50 disabled:opacity-60">
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
              {lines.length === 0 ? (
                <p className="text-muted-foreground"><span className="text-primary">$</span> 코드를 작성하고 실행하세요.</p>
              ) : (
                lines.map((line, index) => (
                  <p
                    key={index}
                    className={cn(
                      'whitespace-pre-wrap break-all',
                      line.type === 'cmd' && 'text-foreground',
                      line.type === 'out' && 'text-foreground/90',
                      line.type === 'info' && 'animate-pulse text-muted-foreground',
                      line.type === 'err' && 'text-destructive',
                      line.type === 'fail' && 'text-amber-300',
                      line.type === 'ok' && 'text-primary',
                      line.type === 'flag' && 'mt-2 flex items-center gap-1.5 font-semibold text-primary',
                    )}
                  >
                    {line.type === 'flag' && <Flag className="size-3.5 shrink-0" />}
                    {line.text}
                  </p>
                ))
              )}
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
              <AnalysisItem
                label="구문 검사"
                value={!syntax ? '대기' : syntax.ok ? '통과' : `${syntax.line ?? '?'}행 오류`}
                active={!!syntax}
                warning={!!syntax && !syntax.ok}
              />
              <AnalysisItem
                label="HTTP 요청 호출"
                value={parsed ? `${parsed.requests ?? 0}건` : '대기'}
                active={!!parsed}
              />
              <AnalysisItem
                label="대상 주소"
                value={parsed ? (unknownHosts.length ? `${unknownHosts.join(', ')} 연결 불가` : usedHosts.join(', ') || '없음') : '대기'}
                active={!!parsed}
                warning={unknownHosts.length > 0}
              />
            </div>
            {(analysisError || (syntax && !syntax.ok)) && (
              <p className="border-t border-border px-4 py-2 font-mono text-[11px] text-destructive">
                {analysisError || (syntax && !syntax.ok ? syntax.message : '')}
              </p>
            )}
            <p className="border-t border-border px-4 py-3 text-[11px] text-muted-foreground">
              코드를 실행하지 않고 Python 구문 트리(ast)로 문법 오류와 요청 대상을 확인합니다.
            </p>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">실습 환경</h2>
            <div className="mt-4 space-y-3">
              {lab.hosts.map((host) => (
                <Machine
                  key={host.name}
                  icon={host.name === 'attacker.lab' ? <Cpu className="size-4 text-accent" /> : <Server className="size-4 text-destructive" />}
                  label={host.role}
                  value={host.name}
                />
              ))}
            </div>
            <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
              코드는 브라우저 안의 Python(Pyodide)에서 실제로 실행돼요. 실습 서버도 브라우저 메모리에 만든 가짜 서버라서 외부로 요청이 나가지 않아요.
              FLAG는 실행할 때마다 새로 만들어져요.
            </p>
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

function BackLink({ cveId }: { cveId: string }) {
  return (
    <Link href={`/cve/${cveId}`} className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-primary">
      <ArrowLeft className="size-3.5" /> CVE 정보로 돌아가기
    </Link>
  )
}

function LabList() {
  const sorted = [...CVES].sort((a, b) => Number(b.id in LABS) - Number(a.id in LABS))
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="border-b border-border pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Practice labs</p>
        <h1 className="mt-3 text-2xl font-bold text-foreground">CVE 실습 목록</h1>
        <p className="mt-2 text-sm text-muted-foreground">실습할 CVE를 선택하세요. 코드는 브라우저 안의 Python에서 실행돼요.</p>
      </header>
      <section className="mt-6 grid grid-cols-1 gap-3">
        {sorted.map((item) => {
          const available = item.id in LABS
          return (
            <Link
              key={item.id}
              href={`/lab?cve=${item.id}`}
              className={cn(
                'group flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-card p-4 sm:flex-nowrap sm:gap-5 transition-colors hover:border-primary/60',
                !available && 'opacity-60',
              )}
            >
              <span className="font-mono sm:min-w-36 text-sm font-semibold text-primary">{item.id}</span>
              <span className="shrink-0"><SeverityBadge severity={item.severity} score={item.cvss} /></span>
              <p className="order-last min-w-0 basis-full truncate sm:order-none sm:basis-0 sm:flex-1 text-sm font-medium text-foreground group-hover:text-primary">{item.title}</p>
              <span
                className={cn(
                  'ml-auto shrink-0 rounded border sm:ml-0 px-2 py-0.5 font-mono text-[11px]',
                  available ? 'border-primary/50 text-primary' : 'border-border text-muted-foreground',
                )}
              >
                {available ? '실습 가능' : '준비 중'}
              </span>
            </Link>
          )
        })}
      </section>
    </main>
  )
}

function AnalysisItem({ label, value, active, warning = false }: { label: string; value: string; active: boolean; warning?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <p className="text-muted-foreground">{label}</p>
      <p className={cn('mt-1 break-all font-mono font-semibold', active ? (warning ? 'text-amber-300' : 'text-primary') : warning ? 'text-amber-300' : 'text-muted-foreground')}>{value}</p>
    </div>
  )
}

function Machine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-2"><span>{icon}</span><div><p className="text-[11px] text-muted-foreground">{label}</p><p className="font-mono text-xs text-foreground">{value}</p></div><CircleDot className="ml-auto size-3 text-primary" /></div>
}
