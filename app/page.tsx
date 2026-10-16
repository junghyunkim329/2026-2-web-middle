import Link from 'next/link'
import { AiSearch } from '@/components/ai-search'
import { CveCard } from '@/components/cve-bits'
import { CVES, CWES } from '@/lib/mock-data'
import {
  ArrowRight,
  BookOpen,
  GitCompare,
  MessageSquare,
  TerminalSquare,
} from 'lucide-react'

const FEATURES = [
  {
    href: '/learn',
    icon: BookOpen,
    title: 'CWE 기반 학습',
    desc: 'CWE 학습',
  },
  {
    href: '/lab',
    icon: TerminalSquare,
    title: '실습 랩',
    desc: '취약점 실습',
  },
  {
    href: '/compare',
    icon: GitCompare,
    title: 'CVE 비교',
    desc: 'CVE 비교',
  },
  {
    href: '/qna',
    icon: MessageSquare,
    title: '질의응답',
    desc: '커뮤니티 Q&A',
  },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <div className="relative mx-auto max-w-4xl px-4 py-44 text-center sm:px-6 sm:py-58">
          <h1 className="mt-6 text-balance font-mono text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl">
            <span className="text-primary text-glow">CVE</span>를 검색하세요
          </h1>

          <div className="mt-10">
            <AiSearch />
          </div>
        </div>
      </section>
    </div>
  )
}
