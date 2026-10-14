import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DeleteButton } from '@/components/delete-button'
import { getCurrentUser } from '@/lib/auth'
import { formatDate } from '@/lib/format'
import { getReport } from '@/lib/queries'
import { ArrowLeft, Pencil } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [user, report] = await Promise.all([getCurrentUser(), getReport(id)])
  if (!report) notFound()

  const isAuthor = user?.id === report.authorId
  const edited = report.updatedAt.getTime() - report.createdAt.getTime() > 1000

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-3.5" /> 리포트 목록
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {report.cveId && (
          <Link
            href={`/cve/${report.cveId}`}
            className="rounded border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-xs text-accent hover:text-primary"
          >
            {report.cveId}
          </Link>
        )}
      </div>
      <h1 className="mt-2 text-pretty break-words text-2xl font-bold text-foreground">{report.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground">
        <span>@{report.author}</span>
        <span>
          {formatDate(report.createdAt)}
          {edited && ` (수정 ${formatDate(report.updatedAt)})`}
        </span>
        {isAuthor && (
          <span className="ml-auto flex items-center gap-3">
            <Link
              href={`/reports/${report.id}/edit`}
              className="inline-flex items-center gap-1 transition-colors hover:text-primary"
            >
              <Pencil className="size-3.5" /> 수정
            </Link>
            <DeleteButton
              url={`/api/reports/${report.id}`}
              confirmMessage="리포트를 삭제할까요?"
              redirectTo="/reports"
            />
          </span>
        )}
      </div>

      {/* 사용자가 쓴 내용은 문자열 그대로 출력한다. (HTML로 해석하지 않으므로 XSS 안전) */}
      <article className="mt-6 whitespace-pre-wrap break-words rounded-xl border border-border bg-card p-5 font-mono text-sm leading-relaxed text-foreground">
        {report.content}
      </article>
    </div>
  )
}
