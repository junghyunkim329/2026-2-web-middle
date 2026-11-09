// components/weakness-chip.tsx — CWE 칩 (해당 CWE의 학습 페이지 /learn/CWE-xx로 연결)
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { getCwe } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export function WeaknessChip({ id, cveId }: { id: string; cveId?: string }) {
  const known = getCwe(id)
  const className =
    'inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs transition-colors hover:border-primary/50 hover:text-primary'

  if (!/^CWE-\d+$/.test(id)) {
    return (
      <span className={cn(className, 'text-muted-foreground hover:border-border hover:text-muted-foreground')}>{id}</span>
    )
  }

  const href = cveId ? `/learn/${id}?cve=${encodeURIComponent(cveId)}` : `/learn/${id}`
  return (
    <Link href={href} className={cn(className, 'border-primary/30')}>
      <BookOpen className="size-3.5 text-primary" />
      <span className="font-semibold text-primary">{id}</span>
      {known && <span className="text-muted-foreground">{known.name}</span>}
      <span className="text-[10px] text-primary">학습하기 →</span>
    </Link>
  )
}
