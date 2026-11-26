// components/labs/sqli-lab.tsx — SQL Injection 체험 실습 (브라우저 안의 SQLite(sql.js)에서 실제 쿼리를 실행)
'use client'

import { useEffect, useRef, useState } from 'react'
import type { Database, SqlValue } from 'sql.js'
import { Database as DbIcon, Play, RotateCcw, ShieldCheck, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

type Mode = 'vuln' | 'safe'

type RunResult =
  | { kind: 'rows'; columns: string[]; rows: SqlValue[][] }
  | { kind: 'error'; message: string }

const SEED_SQL = `
CREATE TABLE users (id TEXT, pw TEXT, name TEXT, role TEXT);
INSERT INTO users VALUES
  ('admin',   'Adm1n!2026', '관리자', 'admin'),
  ('student', 'student123', '김학생', 'user'),
  ('guest',   'guest',      '손님',   'user');
`

const PRESETS = [
  { label: '정상 로그인', id: 'student', pw: 'student123' },
  { label: '주석으로 비밀번호 무시', id: "admin' --", pw: '아무거나' },
  { label: '항상 참인 조건', id: "' OR '1'='1' --", pw: '아무거나' },
  { label: 'UNION으로 비밀번호 조회', id: "' UNION SELECT id, pw, role FROM users --", pw: '아무거나' },
]

function createDb(SQL: { Database: new () => Database }) {
  const db = new SQL.Database()
  db.run(SEED_SQL)
  return db
}

export function SqliLab() {
  const sqlRef = useRef<{ Database: new () => Database } | null>(null)
  const dbRef = useRef<Database | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [mode, setMode] = useState<Mode>('vuln')
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [result, setResult] = useState<RunResult | null>(null)

  useEffect(() => {
    let cancelled = false
    import('sql.js')
      .then(({ default: initSqlJs }) => initSqlJs({ locateFile: () => '/sql-wasm-browser.wasm' }))
      .then((SQL) => {
        if (cancelled) return
        sqlRef.current = SQL
        dbRef.current = createDb(SQL)
        setStatus('ready')
      })
      .catch(() => !cancelled && setStatus('failed'))
    return () => {
      cancelled = true
      dbRef.current?.close()
    }
  }, [])

  function run() {
    const db = dbRef.current
    if (!db) return
    try {
      if (mode === 'vuln') {
        const results = db.exec(`SELECT id, name, role FROM users WHERE id = '${id}' AND pw = '${pw}'`)
        const last = results.at(-1)
        setResult({ kind: 'rows', columns: last?.columns ?? ['id', 'name', 'role'], rows: last?.values ?? [] })
      } else {
        const stmt = db.prepare('SELECT id, name, role FROM users WHERE id = ? AND pw = ?')
        stmt.bind([id, pw])
        const rows: SqlValue[][] = []
        while (stmt.step()) rows.push(stmt.get() as SqlValue[])
        stmt.free()
        setResult({ kind: 'rows', columns: ['id', 'name', 'role'], rows })
      }
    } catch (error) {
      setResult({ kind: 'error', message: error instanceof Error ? error.message : String(error) })
    }
  }

  function reset() {
    dbRef.current?.close()
    if (sqlRef.current) dbRef.current = createDb(sqlRef.current)
    setResult(null)
  }

  const loggedIn = result?.kind === 'rows' && result.rows.length > 0 ? result.rows[0] : null

  return (
    <div className="rounded-lg border border-primary/30 bg-background/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-mono text-xs font-semibold text-primary">
          <DbIcon className="size-4" /> 직접 해보기 · 로그인 폼
        </p>
        <ModeToggle mode={mode} onChange={(next) => { setMode(next); setResult(null) }} />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        브라우저 안에서만 동작하는 SQLite DB에 실제로 쿼리를 실행해요. users 테이블에는 admin, student, guest 계정이 있고,
        student의 비밀번호는 student123이에요.
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => { setId(preset.id); setPw(preset.pw); setResult(null) }}
            className="rounded border border-border px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <form
        className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
        onSubmit={(event) => { event.preventDefault(); run() }}
      >
        <LabInput label="아이디" value={id} onChange={setId} />
        <LabInput label="비밀번호" value={pw} onChange={setPw} />
        <button
          type="submit"
          disabled={status !== 'ready'}
          className="inline-flex h-9 items-center justify-center gap-1.5 self-end rounded-md bg-primary px-4 font-mono text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Play className="size-3.5" /> 로그인
        </button>
      </form>

      <div className="mt-4">
        <p className="font-mono text-[11px] text-muted-foreground">
          {mode === 'vuln' ? '서버가 실행하는 SQL (입력값이 노란색)' : '서버가 실행하는 SQL (입력값은 따로 전달)'}
        </p>
        <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-border bg-card p-3 font-mono text-xs leading-relaxed text-muted-foreground">
          {mode === 'vuln' ? (
            <>
              SELECT id, name, role FROM users WHERE id = &apos;<span className="text-amber-400">{id}</span>&apos; AND pw = &apos;
              <span className="text-amber-400">{pw}</span>&apos;
            </>
          ) : (
            <>
              SELECT id, name, role FROM users WHERE id = <span className="text-primary">?</span> AND pw ={' '}
              <span className="text-primary">?</span>
              {'\n'}
              <span className="text-foreground">-- 바인딩 값: </span>
              <span className="text-amber-400">{JSON.stringify([id, pw])}</span>
            </>
          )}
        </pre>
      </div>

      {status === 'loading' && <p className="mt-3 font-mono text-xs text-muted-foreground">실습 DB를 준비하는 중…</p>}
      {status === 'failed' && (
        <p className="mt-3 font-mono text-xs text-destructive">실습 DB를 불러오지 못했어요. 새로고침해 주세요.</p>
      )}

      {result && (
        <div className="mt-4 space-y-2">
          {result.kind === 'error' ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
              SQL 오류: {result.message}
              <p className="mt-1 text-muted-foreground">입력이 쿼리 문법을 깨뜨렸다는 신호예요. 공격자는 이런 오류로 쿼리 구조를 추측해요.</p>
            </div>
          ) : loggedIn ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-foreground">
              <span className="font-mono font-semibold text-destructive">로그인 성공</span> — {String(loggedIn[1])}({String(loggedIn[0])},
              권한 {String(loggedIn[2])})으로 로그인됨
            </div>
          ) : (
            <div className="rounded-md border border-border bg-card px-3 py-2 font-mono text-xs text-muted-foreground">
              로그인 실패 — 일치하는 계정이 없어요.
            </div>
          )}

          {result.kind === 'rows' && result.rows.length > 0 && (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full font-mono text-xs">
                <thead className="bg-card text-muted-foreground">
                  <tr>
                    {result.columns.map((column) => (
                      <th key={column} className="px-3 py-1.5 text-left font-medium">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i} className="border-t border-border text-foreground">
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-1.5">{String(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
        <p className="text-[11px] text-muted-foreground">
          {mode === 'vuln'
            ? '안전한 코드로 바꾼 뒤 같은 입력을 다시 넣어 보세요.'
            : '입력이 값으로만 전달되므로 따옴표를 넣어도 쿼리 구조가 바뀌지 않아요.'}
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-primary"
        >
          <RotateCcw className="size-3" /> DB 초기화
        </button>
      </div>
    </div>
  )
}

export function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5 font-mono text-[11px]">
      <button
        type="button"
        onClick={() => onChange('vuln')}
        className={cn(
          'inline-flex items-center gap-1 rounded px-2 py-1 transition-colors',
          mode === 'vuln' ? 'bg-destructive/15 text-destructive' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <ShieldAlert className="size-3" /> 취약한 코드
      </button>
      <button
        type="button"
        onClick={() => onChange('safe')}
        className={cn(
          'inline-flex items-center gap-1 rounded px-2 py-1 transition-colors',
          mode === 'safe' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <ShieldCheck className="size-3" /> 안전한 코드
      </button>
    </div>
  )
}

export function LabInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        spellCheck={false}
        className="mt-1 h-9 w-full rounded-md border border-border bg-card px-3 font-mono text-xs text-foreground outline-none focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary"
      />
    </label>
  )
}
