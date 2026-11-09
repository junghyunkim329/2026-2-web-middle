// components/description-lang.tsx — CVE 설명이 한국어인지 영어 원문인지 알려주는 작은 표시
import { Languages } from 'lucide-react'

export function DescriptionLang({ lang }: { lang?: string | null }) {
  if (lang === 'ko') {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[11px] text-primary">
        <Languages className="size-3" /> 한국어
      </span>
    )
  }
  if (lang === 'en') {
    return (
      <span
        title="NVD에 한국어 번역이 없어 영어 원문을 표시합니다."
        className="inline-flex items-center gap-1 rounded border border-border bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
      >
        <Languages className="size-3" /> 영어 원문 · 한국어 번역 없음
      </span>
    )
  }
  return null
}
