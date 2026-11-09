// app/cves/[id]/not-found.tsx — 잘못된 CVE ID이거나 NVD에 없는 CVE일 때 보여주는 404 화면
import Link from 'next/link'
import { ArrowLeft, SearchX } from 'lucide-react'

export default function CveNotFound() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="relative mx-auto max-w-xl px-4 py-28 text-center sm:px-6">
        <SearchX className="mx-auto size-10 text-primary" />
        <p className="mt-4 font-mono text-sm text-primary text-glow">404</p>
        <h1 className="mt-2 font-mono text-2xl font-bold text-foreground">CVE를 찾을 수 없습니다</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          CVE ID 형식(예: CVE-2024-3094)이 맞는지, NVD에 등록된 취약점인지 확인해주세요.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          <ArrowLeft className="size-4" /> 검색으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
