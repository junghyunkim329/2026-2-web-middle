import { Suspense } from 'react'
import LabContent from './lab-content'

export default function LabPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted-foreground sm:px-6">
          실습 환경을 불러오는 중...
        </div>
      }
    >
      <LabContent />
    </Suspense>
  )
}
