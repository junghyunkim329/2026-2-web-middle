import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { formatDate } from '@/lib/format'
import { listReports } from '@/lib/queries'
import { LIMITS } from '@/lib/validators'
import { FileText, Plus, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const search = typeof q === 'string' ? q.trim().slice(0, LIMITS.searchMax) : ''
  const [user, reports] = await Promise.all([getCurrentUser(), listReports({ search })])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            <h1 className="font-mono text-3xl font-bold text-foreground">원데이 리포트</h1>
          </div>
          <p className="mt-1 text-base text-muted-foreground">
            CVE를 공부하며 정리한 내용을 기록하고 함께 나눕니다.
          </p>
        </div>
        <Link
          href={user ? '/reports/new' : '/login?next=/reports/new'}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" /> {user ? '새 리포트' : '로그인하고 작성하기'}
        </Link>
      </div>

      <form
        action="/reports"
        className="mt-6 flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2"
      >
        <Search className="size-4 text-muted-foreground" />
        <input
          name="q"
          defaultValue={search}
          maxLength={LIMITS.searchMax}
          placeholder="제목, CVE ID, 내용으로 검색..."
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </form>

      <div className="mt-6 space-y-3">
        {reports.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {search ? `'${search}'에 대한 리포트가 없습니다.` : '아직 작성된 리포트가 없습니다. 첫 리포트를 남겨보세요!'}
          </p>
        )}
        {reports.map((r) => (
          <Link
            key={r.id}
            href={`/reports/${r.id}`}
            className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent/50"
          >
            <div className="flex flex-wrap items-center gap-2">
              {r.cveId && (
                <span className="rounded border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[11px] text-accent">
                  {r.cveId}
                </span>
              )}
              <h3 className="min-w-0 break-words font-medium text-foreground">{r.title}</h3>
            </div>
            <p className="mt-1 line-clamp-2 break-all text-sm text-muted-foreground">{r.excerpt}</p>
            <div className="mt-2 flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
              <span>@{r.author}</span>
              <span>{formatDate(r.createdAt)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
