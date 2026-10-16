'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CveCard } from '@/components/cve-bits'
import { CVES } from '@/lib/mock-data'

export default function CvesPage() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get('search') ?? '')
  const [severity, setSeverity] = useState('전체')

  const filtered = useMemo(() => CVES.filter((cve) => {
    const matchesQuery = `${cve.id} ${cve.title} ${cve.vendor}`.toLowerCase().includes(query.toLowerCase())
    const matchesSeverity = severity === '전체' || cve.severity === severity
    return matchesQuery && matchesSeverity
  }), [query, severity])

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">Vulnerability database</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">CVE 목록</h1>
        <p className="text-sm text-muted-foreground">CVE 번호와 기본 위험 정보를 빠르게 확인하세요.</p>
      </div>

      <section className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">CVE 검색</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="CVE-2024-3094 검색"
            className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </label>
        <div className="flex gap-1 overflow-x-auto">
          {['전체', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSeverity(item)}
              className={`rounded-md border px-3 py-2 font-mono text-xs transition-colors ${severity === item ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-xs text-muted-foreground">{filtered.length}개 CVE</p>
        <Link href="/compare" className="text-xs text-primary hover:underline">비교하기</Link>
      </div>

      <section className="grid gap-2" aria-label="CVE 목록">
        {filtered.map((cve) => <CveCard key={cve.id} cve={cve} />)}
        {filtered.length === 0 && <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</div>}
      </section>
    </main>
  )
}
