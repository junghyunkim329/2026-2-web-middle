<<<<<<< HEAD
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { QNA } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import {
  MessageSquare,
  Eye,
  CheckCircle2,
  Plus,
  Search,
} from 'lucide-react'

const FILTERS = ['최신', '인기', '미해결', '해결됨'] as const

export default function QnaPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('최신')
  const [asking, setAsking] = useState(false)

  const list = [...QNA].sort((a, b) => {
    if (filter === '인기') return b.votes - a.votes
    return 0
  })
  const shown =
    filter === '미해결'
      ? list.filter((q) => !q.solved)
      : filter === '해결됨'
        ? list.filter((q) => q.solved)
        : list

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
=======
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { timeAgo } from '@/lib/format'
import { listQuestions, type QnaFilter } from '@/lib/queries'
import { LIMITS } from '@/lib/validators'
import { cn } from '@/lib/utils'
import { MessageSquare, Eye, CheckCircle2, Search } from 'lucide-react'
import { AskQuestion } from './ask-question'

export const dynamic = 'force-dynamic'

const FILTERS: { key: QnaFilter; label: string }[] = [
  { key: 'latest', label: '최신' },
  { key: 'popular', label: '인기' },
  { key: 'unsolved', label: '미해결' },
  { key: 'solved', label: '해결됨' },
]

export default async function QnaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>
}) {
  const params = await searchParams
  const search = typeof params.q === 'string' ? params.q.trim().slice(0, LIMITS.searchMax) : ''
  const filter = FILTERS.find((f) => f.key === params.filter)?.key ?? 'latest'

  const [user, questions] = await Promise.all([
    getCurrentUser(),
    listQuestions({ search, filter }),
  ])

  const filterHref = (key: QnaFilter) => {
    const query = new URLSearchParams()
    if (key !== 'latest') query.set('filter', key)
    if (search) query.set('q', search)
    const qs = query.toString()
    return qs ? `/qna?${qs}` : '/qna'
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <AskQuestion loggedIn={Boolean(user)}>
>>>>>>> f4c72dade4c5d8c5f4919d1941cf1ec554a9f47c
        <div className="flex items-center gap-2">
          <MessageSquare className="size-5 text-primary" />
          <h1 className="font-mono text-3xl font-bold text-foreground">질의응답</h1>
        </div>
<<<<<<< HEAD
        <button
          onClick={() => setAsking((v) => !v)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" /> 질문하기
        </button>
      </div>
      <p className="mt-1 text-base text-muted-foreground">
        취약점 대응·실습·분석에 대해 사용자끼리 묻고 답합니다.
      </p>

      {asking && (
        <div className="mt-4 rounded-lg border border-primary/30 bg-card p-4 box-glow">
          <input
            placeholder="질문 제목을 입력하세요"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
          <textarea
            rows={4}
            placeholder="상황과 시도한 내용을 구체적으로 작성해주세요."
            className="mt-2 w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus:border-primary/60"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setAsking(false)}
              className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground"
            >
              취소
            </button>
            <button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
              등록
            </button>
          </div>
        </div>
      )}

      {/* search + filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            placeholder="질문 검색..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                filter === f
=======
        <p className="mt-1 text-base text-muted-foreground">
          취약점 대응·실습·분석에 대해 사용자끼리 묻고 답합니다.
        </p>
      </AskQuestion>

      {/* search + filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <form
          action="/qna"
          className="flex flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 py-2"
        >
          <Search className="size-4 text-muted-foreground" />
          {filter !== 'latest' && <input type="hidden" name="filter" value={filter} />}
          <input
            name="q"
            defaultValue={search}
            maxLength={LIMITS.searchMax}
            placeholder="질문 검색..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </form>
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={filterHref(f.key)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                filter === f.key
>>>>>>> f4c72dade4c5d8c5f4919d1941cf1ec554a9f47c
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border bg-secondary text-muted-foreground hover:text-foreground',
              )}
            >
<<<<<<< HEAD
              {f}
            </button>
=======
              {f.label}
            </Link>
>>>>>>> f4c72dade4c5d8c5f4919d1941cf1ec554a9f47c
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3">
<<<<<<< HEAD
        {shown.map((q) => (
=======
        {questions.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {search ? `'${search}'에 대한 질문이 없습니다.` : '아직 등록된 질문이 없습니다. 첫 질문을 남겨보세요!'}
          </p>
        )}
        {questions.map((q) => (
>>>>>>> f4c72dade4c5d8c5f4919d1941cf1ec554a9f47c
          <Link
            key={q.id}
            href={`/qna/${q.id}`}
            className="flex gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent/50"
          >
            <div className="min-w-0 flex-1">
<<<<<<< HEAD

              <div className="flex items-start gap-2">
                {q.solved && <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />}
                <h3 className="text-pretty font-medium text-foreground">{q.title}</h3>
              </div>
              <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{q.excerpt}</p>
              <div className="mt-2 flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
                <span>@{q.author}</span>
                <span>{q.createdAt}</span>
=======
              <div className="flex items-start gap-2">
                {q.solved && <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />}
                <h3 className="text-pretty break-words font-medium text-foreground">{q.title}</h3>
              </div>
              <p className="mt-1 line-clamp-1 break-all text-sm text-muted-foreground">{q.excerpt}</p>
              <div className="mt-2 flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
                <span>@{q.author}</span>
                <span>{timeAgo(q.createdAt)}</span>
>>>>>>> f4c72dade4c5d8c5f4919d1941cf1ec554a9f47c
                <span className="flex items-center gap-1">
                  <Eye className="size-3" /> {q.views}
                </span>
              </div>
            </div>

<<<<<<< HEAD
            <div className="order-last flex shrink-0 flex-col items-center gap-2 pt-1 text-center">
              <div className="flex flex-col items-center">
                <span className="font-mono text-sm font-bold text-foreground">{q.votes}</span>
                <span className="text-[10px] text-muted-foreground">추천</span>
              </div>
=======
            <div className="order-last flex shrink-0 flex-col items-center justify-center text-center">
>>>>>>> f4c72dade4c5d8c5f4919d1941cf1ec554a9f47c
              <div
                className={cn(
                  'flex flex-col items-center rounded-md border px-2 py-1',
                  q.solved
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground',
                )}
              >
<<<<<<< HEAD
                <span className="font-mono text-sm font-bold">{q.answers}</span>
=======
                <span className="font-mono text-sm font-bold">{q.answerCount}</span>
>>>>>>> f4c72dade4c5d8c5f4919d1941cf1ec554a9f47c
                <span className="text-[10px]">답변 수</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
