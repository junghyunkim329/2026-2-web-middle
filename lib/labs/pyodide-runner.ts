// lib/labs/pyodide-runner.ts — 브라우저 Web Worker 안에서 Pyodide(Python WASM)로 실습 코드를 실행한다.
// 실행마다 새 Worker를 써서 이전 실행의 상태가 남지 않게 하고, 시간 초과 시 Worker를 통째로 종료한다.

const PYODIDE_BASE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'

const WORKER_SOURCE = `
importScripts('${PYODIDE_BASE}pyodide.js')
const ready = loadPyodide({ indexURL: '${PYODIDE_BASE}' })

self.onmessage = async (event) => {
  const { kind, setup, code, packages, analyzer } = event.data
  let pyodide
  try {
    pyodide = await ready
  } catch (error) {
    self.postMessage({ type: 'error', text: 'Python 환경을 불러오지 못했어요: ' + String(error && error.message || error) })
    return
  }
  pyodide.setStdin({ error: true })
  pyodide.setStdout({ batched: (text) => self.postMessage({ type: 'stdout', text }) })
  pyodide.setStderr({ batched: (text) => self.postMessage({ type: 'stderr', text }) })
  try {
    if (kind === 'analyze') {
      const ns = pyodide.globals.get('dict')()
      await pyodide.runPythonAsync(analyzer, { globals: ns })
      const result = ns.get('_analyze')(code)
      self.postMessage({ type: 'analysis', text: result })
      return
    }
    if (packages && packages.length) await pyodide.loadPackage(packages, { messageCallback: () => {} })
    await pyodide.runPythonAsync(setup, { globals: pyodide.globals.get('dict')(), filename: 'lab_setup.py' })
    self.postMessage({ type: 'started' })
    await pyodide.runPythonAsync(code, { globals: pyodide.globals.get('dict')(), filename: 'exploit.py' })
    self.postMessage({ type: 'done' })
  } catch (error) {
    self.postMessage({ type: 'error', text: String(error && error.message || error) })
  }
}
`

export type RunResult =
  | { status: 'done' }
  | { status: 'error'; message: string }
  | { status: 'timeout' }

export type CodeAnalysis = {
  syntax: { ok: boolean; line?: number | null; message?: string }
  requests?: number
  hosts?: string[]
}

// Pyodide 내부 프레임은 빼고 학생 코드(exploit.py) 부분의 traceback만 남긴다.
function cleanTraceback(message: string) {
  const lines = message.split('\n')
  const start = lines.findIndex((line) => line.includes('File "exploit.py"'))
  if (start === -1) return message.trim()
  return ['Traceback (most recent call last):', ...lines.slice(start)].join('\n').trim()
}

export class PythonLabRunner {
  private readonly url: string
  private spare: Worker | null = null

  constructor() {
    this.url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'text/javascript' }))
    this.prepare()
  }

  // 다음 실행 때 바로 쓸 수 있도록 Worker 하나를 미리 띄워 Pyodide를 불러 둔다.
  private prepare() {
    if (!this.spare) this.spare = new Worker(this.url)
  }

  private take() {
    this.prepare()
    const worker = this.spare!
    this.spare = null
    return worker
  }

  run(options: {
    setup: string
    code: string
    packages: string[]
    timeoutMs: number
    onOutput: (stream: 'stdout' | 'stderr', text: string) => void
    onStarted?: () => void
  }): Promise<RunResult> {
    const worker = this.take()
    return new Promise((resolve) => {
      let timer: ReturnType<typeof setTimeout> | undefined
      const finish = (result: RunResult) => {
        clearTimeout(timer)
        worker.terminate()
        this.prepare()
        resolve(result)
      }
      // Pyodide 로딩은 느릴 수 있어 넉넉히 기다리고, 학생 코드가 시작되면 실행 시간 제한을 건다.
      timer = setTimeout(() => finish({ status: 'error', message: 'Python 환경 로딩이 너무 오래 걸려요. 네트워크를 확인해 주세요.' }), 60_000)
      worker.onmessage = (event: MessageEvent<{ type: string; text?: string }>) => {
        const { type, text = '' } = event.data
        if (type === 'stdout' || type === 'stderr') options.onOutput(type, text)
        else if (type === 'started') {
          clearTimeout(timer)
          timer = setTimeout(() => finish({ status: 'timeout' }), options.timeoutMs)
          options.onStarted?.()
        } else if (type === 'done') finish({ status: 'done' })
        else if (type === 'error') finish({ status: 'error', message: cleanTraceback(text) })
      }
      worker.onerror = (event) => finish({ status: 'error', message: event.message || 'Worker 오류가 발생했어요.' })
      worker.postMessage({ kind: 'run', setup: options.setup, code: options.code, packages: options.packages })
    })
  }

  analyze(code: string, analyzer: string): Promise<CodeAnalysis> {
    const worker = this.take()
    return new Promise((resolve, reject) => {
      const finish = (fn: () => void) => {
        clearTimeout(timer)
        worker.terminate()
        this.prepare()
        fn()
      }
      const timer = setTimeout(() => finish(() => reject(new Error('분석 시간이 초과됐어요.'))), 60_000)
      worker.onmessage = (event: MessageEvent<{ type: string; text?: string }>) => {
        const { type, text = '' } = event.data
        if (type === 'analysis') finish(() => resolve(JSON.parse(text) as CodeAnalysis))
        else if (type === 'error') finish(() => reject(new Error(text)))
      }
      worker.onerror = (event) => finish(() => reject(new Error(event.message || 'Worker 오류가 발생했어요.')))
      worker.postMessage({ kind: 'analyze', code, analyzer })
    })
  }

  dispose() {
    this.spare?.terminate()
    this.spare = null
    URL.revokeObjectURL(this.url)
  }
}

export function createFlag() {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return `FLAG{${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}}`
}
