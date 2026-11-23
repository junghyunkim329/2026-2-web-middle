// components/labs/xss-lab.tsx — XSS 체험 실습 (사이트와 격리된 sandbox iframe 안에서 입력을 실제로 렌더링)
'use client'

import { useEffect, useRef, useState } from 'react'
import { Code2, Play } from 'lucide-react'
import { LabInput, ModeToggle } from './sqli-lab'

type Mode = 'vuln' | 'safe'

const PRESETS = [
  { label: '일반 이름', value: '김학생' },
  { label: 'HTML 태그', value: '<b style="color:#f87171">굵은 글씨</b>' },
  { label: '<script> 태그', value: "<script>alert('XSS')</script>" },
  { label: 'img onerror', value: "<img src=x onerror=\"alert('XSS')\">" },
  { label: 'svg onload', value: '<svg onload="alert(document.title)">' },
]

function buildDocument(input: string, mode: Mode, runId: number) {
  const value = JSON.stringify(input).replace(/</g, '\\u003c')
  const sink = mode === 'vuln' ? 'innerHTML' : 'textContent'
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>실습 페이지</title>
<style>body{margin:0;padding:16px;font:14px/1.6 system-ui,sans-serif;color:#e5e7eb;background:#0b0f0c}</style>
<script>
  const send = (type, payload) => parent.postMessage({ source: 'cvehub-xss-lab', runId: ${runId}, type, payload }, '*')
  window.alert = (message) => send('alert', String(message))
  window.addEventListener('error', (event) => send('error', String(event.message)))
</script></head>
<body><p id="greeting"></p>
<script>
  const name = ${value}
  const el = document.getElementById('greeting')
  el.${sink} = '안녕하세요, ' + name + '님'
  send('dom', el.innerHTML)
</script></body></html>`
}

export function XssLab() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [mode, setMode] = useState<Mode>('vuln')
  const [input, setInput] = useState('')
  const [run, setRun] = useState<{ id: number; doc: string } | null>(null)
  const [dom, setDom] = useState<string | null>(null)
  const [alerts, setAlerts] = useState<string[]>([])

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return
      const data = event.data as { source?: string; runId?: number; type?: string; payload?: string }
      if (data?.source !== 'cvehub-xss-lab' || data.runId !== run?.id) return
      if (data.type === 'dom') setDom(String(data.payload))
      if (data.type === 'alert') setAlerts((prev) => [...prev, String(data.payload)].slice(-5))
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [run?.id])

  function execute(nextMode = mode, value = input) {
    const id = Date.now()
    setDom(null)
    setAlerts([])
    setRun({ id, doc: buildDocument(value, nextMode, id) })
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-background/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-mono text-xs font-semibold text-primary">
          <Code2 className="size-4" /> 직접 해보기 · 인사말 페이지
        </p>
        <ModeToggle
          mode={mode}
          onChange={(next) => {
            setMode(next)
            if (run) execute(next)
          }}
        />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        입력한 이름이 아래 실습 화면에 그대로 출력돼요. 실습 화면은 sandbox iframe으로 격리되어 있어서 이 사이트의
        쿠키·로그인 정보에는 접근할 수 없어요.
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => { setInput(preset.value); execute(mode, preset.value) }}
            className="rounded border border-border px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <form
        className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]"
        onSubmit={(event) => { event.preventDefault(); execute() }}
      >
        <LabInput label="이름 (?name= 값)" value={input} onChange={setInput} />
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center gap-1.5 self-end rounded-md bg-primary px-4 font-mono text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Play className="size-3.5" /> 페이지 열기
        </button>
      </form>

      <div className="mt-4">
        <p className="font-mono text-[11px] text-muted-foreground">실행되는 코드</p>
        <pre className="mt-1.5 overflow-x-auto rounded-md border border-border bg-card p-3 font-mono text-xs leading-relaxed text-muted-foreground">
          greeting.<span className={mode === 'vuln' ? 'text-destructive' : 'text-primary'}>
            {mode === 'vuln' ? 'innerHTML' : 'textContent'}
          </span>{' '}
          = &apos;안녕하세요, &apos; + <span className="text-amber-400">name</span> + &apos;님&apos;
        </pre>
      </div>

      {run && (
        <div className="mt-4 space-y-3">
          <div>
            <p className="font-mono text-[11px] text-muted-foreground">피해자 브라우저 화면</p>
            <iframe
              key={run.id}
              ref={iframeRef}
              title="XSS 실습 화면"
              sandbox="allow-scripts"
              srcDoc={run.doc}
              className="mt-1.5 h-24 w-full rounded-md border border-border bg-[#0b0f0c]"
            />
          </div>

          {alerts.length > 0 ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs">
              <p className="font-mono font-semibold text-destructive">스크립트 실행됨!</p>
              {alerts.map((message, i) => (
                <p key={i} className="mt-1 font-mono text-foreground">alert(&quot;{message}&quot;)</p>
              ))}
              <p className="mt-1 text-muted-foreground">
                실제 공격이라면 alert 대신 쿠키 탈취, 사용자 대신 요청 보내기 같은 코드가 실행돼요.
              </p>
            </div>
          ) : (
            dom !== null && (
              <div className="rounded-md border border-border bg-card px-3 py-2 font-mono text-xs text-muted-foreground">
                스크립트가 실행되지 않았어요.
                {mode === 'vuln' && input.includes('<script') && (
                  <span className="mt-1 block">
                    innerHTML로 넣은 &lt;script&gt; 태그는 브라우저가 실행하지 않아요. 이벤트 핸들러(onerror, onload)를 써 보세요.
                  </span>
                )}
              </div>
            )
          )}

          {dom !== null && (
            <div>
              <p className="font-mono text-[11px] text-muted-foreground">브라우저가 해석한 HTML (greeting.innerHTML)</p>
              <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-border bg-card p-3 font-mono text-xs text-foreground">
                {dom}
              </pre>
            </div>
          )}
        </div>
      )}

      <p className="mt-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
        {mode === 'vuln'
          ? '안전한 코드로 바꾸면 같은 입력이 HTML이 아닌 글자로 출력돼요.'
          : 'textContent는 입력을 글자로만 넣기 때문에 태그 기호(<, >)까지 글자 그대로 보여요.'}
      </p>
    </div>
  )
}
