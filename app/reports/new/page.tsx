import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { normalizeCveId } from '@/lib/validators'
import { ArrowLeft } from 'lucide-react'
import { ReportForm } from '../report-form'

export const dynamic = 'force-dynamic'

export default async function NewReportPage({
  searchParams,
}: {
  searchParams: Promise<{ cve?: string }>
}) {
  const { cve } = await searchParams
  // CVE 상세 페이지의 '원데이 리포트 작성' 버튼으로 들어오면 CVE ID를 미리 채운다.
  const cveId = typeof cve === 'string' ? (normalizeCveId(cve) ?? '') : ''

  if (!(await getCurrentUser())) {
    const next = cveId ? `/reports/new?cve=${cveId}` : '/reports/new'
    redirect(`/login?next=${encodeURIComponent(next)}`)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-3.5" /> 리포트 목록
      </Link>
      <h1 className="mt-4 font-mono text-2xl font-bold text-foreground">새 원데이 리포트</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">공부한 CVE 내용을 정리해 기록하세요.</p>
      <ReportForm initial={{ title: '', cveId, content: '' }} />
    </div>
  )
}
