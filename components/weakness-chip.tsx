// components/weakness-chip.tsx — CWE 칩 (학습 페이지가 있으면 /learn/CWE-xx로, 없으면 MITRE 설명 페이지로 연결)
import Link from 'next/link'
import { BookOpen, ExternalLink } from 'lucide-react'
import { getCwe } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export function WeaknessChip({ id }: { id: string }) {
  const known = getCwe(id)
  const isCwe = /^CWE-\d+$/.test(id)
  const className =
    'inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs transition-colors hover:border-primary/50 hover:text-primary'

  if (known) {
    return (
      <Link href={`/learn/${known.id}`} className={cn(className, 'border-primary/30')}>
        <BookOpen className="size-3.5 text-primary" />
        <span className="font-semibold text-primary">{known.id}</span>
        <span className="text-muted-foreground">{known.name}</span>
        <span className="text-[10px] text-primary">학습하기 →</span>
      </Link>
    )
  }
  if (isCwe) {
    return (
      <a
        href={`https://cwe.mitre.org/data/definitions/${id.replace('CWE-', '')}.html`}
        target="_blank"
        rel="noreferrer"
        title="학습 페이지가 아직 없어 MITRE 설명으로 연결합니다."
        className={className}
      >
        <span className="font-semibold text-foreground">{id}</span>
        <ExternalLink className="size-3 text-muted-foreground" />
      </a>
    )
  }
  return (
    <span className={cn(className, 'text-muted-foreground hover:border-border hover:text-muted-foreground')}>{id}</span>
  )
}
