import { Suspense } from 'react'
import CveList from './cve-list'

export default function CvesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground sm:px-6">
          CVE 목록을 불러오는 중...
        </div>
      }
    >
      <CveList />
    </Suspense>
  )
}
