// app/cves/[id]/loading.tsx — CVE 상세 페이지가 NVD 데이터를 불러오는 동안 보여주는 스켈레톤 화면
export default function CveDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8 sm:px-6 sm:py-10" aria-busy="true">
      <div className="h-3 w-28 rounded bg-secondary" />
      <div className="mt-6 border-b border-border pb-8">
        <div className="flex items-center gap-3">
          <div className="h-9 w-64 rounded bg-secondary" />
          <div className="h-6 w-24 rounded bg-secondary" />
        </div>
        <div className="mt-4 h-3 w-72 rounded bg-secondary" />
        <div className="mt-6 flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-24 rounded-md bg-secondary" />
          ))}
        </div>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          <div className="h-32 rounded-xl bg-card" />
          <div className="h-24 rounded-xl bg-card" />
          <div className="grid gap-2 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-card" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-40 rounded-xl bg-card" />
          <div className="h-48 rounded-xl bg-card" />
        </div>
      </div>
      <p className="sr-only">CVE 정보를 불러오는 중입니다.</p>
    </div>
  )
}
