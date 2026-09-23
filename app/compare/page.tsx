'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CVES, severityMeta, type Cve } from '@/lib/mock-data'
import { Check, Minus, Plus, X, GitCompare, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const ROWS: {
  key: string
  label: string
  render: (c: Cve) => React.ReactNode
}[] = [
  {
    key: 'severity',
    label: '심각도',
    render: (c) => (
      <span
        className={cn(
          'inline-flex rounded border px-2 py-0.5 font-mono text-xs font-semibold',
          severityMeta[c.severity].token,
        )}
      >
        {c.severity}
      </span>
    ),
  },
  {
    key: 'cvss',
    label: 'CVSS 점수',
    render: (c) => <span className="font-mono font-bold text-destructive">{c.cvss.toFixed(1)}</span>,
  },
  {
    key: 'vector',
    label: 'CVSS 벡터',
    render: (c) => (
      <span className="break-all font-mono text-[11px] text-muted-foreground">
        {c.cvssVector.replace('CVSS:3.1/', '')}
      </span>
    ),
  },
  {
    key: 'epss',
    label: 'EPSS',
    render: (c) => (
      <span className="font-mono font-bold text-warning">{(c.epss * 100).toFixed(0)}%</span>
    ),
  },
  { key: 'kev', label: 'KEV 등재', render: (c) => <Bool value={c.kev} danger /> },
  {
    key: 'exploit',
    label: 'Exploit 공개',
    render: (c) => <Bool value={c.exploitPublic} danger />,
  },
  { key: 'patched', label: '패치 여부', render: (c) => <Bool value={c.patched} /> },
  {
    key: 'products',
    label: '영향 제품',
    render: (c) => (
      <span className="font-mono text-[11px] text-muted-foreground">
        {c.products.join(', ')}
      </span>
    ),
  },
  {
    key: 'cwe',
    label: 'CWE',
    render: (c) => (
      <Link href={`/learn/${c.cwe}`} className="font-mono text-xs text-accent hover:text-primary">
        {c.cwe}
      </Link>
    ),
  },
]

function Bool({ value, danger }: { value: boolean; danger?: boolean }) {
  if (value)
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 font-mono text-xs font-semibold',
          danger ? 'text-destructive' : 'text-primary',
        )}
      >
        <Check className="size-3.5" /> 예
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
      <Minus className="size-3.5" /> 아니오
    </span>
  )
}

export default function ComparePage() {
  const [selected, setSelected] = useState<string[]>([
    'CVE-2024-3094',
    'CVE-2021-44228',
    'CVE-2023-34362',
  ])
  const [picker, setPicker] = useState(false)
  const [query, setQuery] = useState('')

  const cves = selected.map((id) => CVES.find((c) => c.id === id)!).filter(Boolean)
  const available = CVES.filter(
    (c) =>
      !selected.includes(c.id) &&
      `${c.id} ${c.title}`.toLowerCase().includes(query.toLowerCase()),
  )

  function remove(id: string) {
    setSelected((s) => s.filter((x) => x !== id))
  }
  function add(id: string) {
    if (selected.length >= 4) return
    setSelected((s) => [...s, id])
    setPicker(false)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-2">
        <GitCompare className="size-5 text-primary" />
        <h1 className="font-mono text-2xl font-bold text-foreground">CVE 비교</h1>
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          CVSS·EPSS·KEV·Exploit·패치 기준 비교
        </p>
        {selected.length < 4 && (
          <button
            onClick={() => setPicker(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/50 px-3 py-2 font-mono text-xs text-primary transition-colors hover:bg-primary/10"
          >
            <Plus className="size-4" /> CVE 추가
          </button>
        )}
      </div>

      {picker && (
        <div className="mt-4 rounded-lg border border-accent/40 bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-sm text-accent">비교할 CVE 선택</span>
            <button onClick={() => { setPicker(false); setQuery('') }} aria-label="닫기">
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>
          <label className="relative mb-3 block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="CVE 번호 검색"
              aria-label="추가할 CVE 검색"
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              autoFocus
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {available.map((c) => (
              <button
                key={c.id}
                onClick={() => add(c.id)}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-left transition-colors hover:border-primary/50"
              >
                <span className="font-mono text-xs text-accent">{c.id}</span>
                <span className="truncate text-xs text-muted-foreground">{c.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-card">
              <th className="sticky left-0 z-10 min-w-32 border-b border-r border-border bg-card p-4 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                기준
              </th>
              {cves.map((c) => (
                <th
                  key={c.id}
                  className="min-w-56 border-b border-l border-border p-4 text-left align-top"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/cve/${c.id}`}
                      className="font-mono text-sm font-bold text-accent hover:text-primary"
                    >
                      {c.id}
                    </Link>
                    <button
                      onClick={() => remove(c.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`${c.id} 제거`}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs font-normal leading-snug text-muted-foreground">
                    {c.title}
                  </p>
                </th>
              ))}

            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={row.key} className={i % 2 ? 'bg-card/40' : 'bg-background'}>
                <td className="sticky left-0 z-10 border-r border-border bg-inherit p-4 font-mono text-xs font-semibold text-foreground">
                  {row.label}
                </td>
                {cves.map((c) => (
                  <td key={c.id} className="border-l border-border p-4 align-top">
                    {row.render(c)}
                  </td>
                ))}
                {selected.length < 4 && <td className="border-l border-border" />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cves.length === 0 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          비교할 CVE를 추가하세요.
        </p>
      )}
    </div>
  )
}
