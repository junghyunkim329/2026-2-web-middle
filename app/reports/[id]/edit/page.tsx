import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getReport } from '@/lib/queries'
import { ArrowLeft } from 'lucide-react'
import { ReportForm } from '../../report-form'

export const dynamic = 'force-dynamic'

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/reports/${id}/edit`)}`)

  const report = await getReport(id)
  if (!report) notFound()
  // 작성자가 아니면 수정 화면 대신 읽기 화면으로 보낸다. (API에서도 다시 확인함)
  if (report.authorId !== user.id) redirect(`/reports/${report.id}`)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href={`/reports/${report.id}`}
        className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-3.5" /> 리포트로 돌아가기
      </Link>
      <h1 className="mt-4 mb-6 font-mono text-2xl font-bold text-foreground">리포트 수정</h1>
      <ReportForm
        reportId={report.id}
        initial={{ title: report.title, cveId: report.cveId ?? '', content: report.content }}
      />
    </div>
  )
}
