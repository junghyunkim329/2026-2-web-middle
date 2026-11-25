// app/learn/[cwe]/learning-progress.tsx — 학습 진행률 표시와 단계별 완료 버튼 (서버에 저장)
'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { apiFetch } from '@/lib/client-api'
import { cn } from '@/lib/utils'

type ProgressState = {
  completed: number[]
  total: number
  pending: number | null
  error: string
  toggle: (lesson: number) => void
}

const ProgressContext = createContext<ProgressState | null>(null)

function useProgress() {
  const value = useContext(ProgressContext)
  if (!value) throw new Error('LearningProgressProvider 안에서만 사용할 수 있어요.')
  return value
}

export function LearningProgressProvider({
  cweId,
  initialCompleted,
  total,
  children,
}: {
  cweId: string
  initialCompleted: number[]
  total: number
  children: ReactNode
}) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [pending, setPending] = useState<number | null>(null)
  const [error, setError] = useState('')

  async function toggle(lesson: number) {
    if (pending !== null) return
    const done = !completed.includes(lesson)
    setPending(lesson)
    setError('')
    const result = await apiFetch<{ completed: number[] }>(`/api/learn/${encodeURIComponent(cweId)}/progress`, {
      method: 'PUT',
      body: { lesson, done },
    })
    if (result.ok) setCompleted(result.data.completed)
    else setError(result.error)
    setPending(null)
  }

  return (
    <ProgressContext.Provider value={{ completed, total, pending, error, toggle }}>{children}</ProgressContext.Provider>
  )
}

export function ProgressBar() {
  const { completed, total, error } = useProgress()
  const percent = total === 0 ? 0 : Math.round((completed.length / total) * 100)
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between font-mono text-xs">
        <span className="text-muted-foreground">학습 진행률</span>
        <span className={percent === 100 ? 'text-primary' : 'text-muted-foreground'}>
          {completed.length}/{total} 단계 · {percent}%
        </span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${percent}%` }} />
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function LessonStatusIcon({ lesson }: { lesson: number }) {
  const { completed } = useProgress()
  return completed.includes(lesson) ? (
    <CheckCircle2 className="size-5 shrink-0 text-primary" aria-label="완료" />
  ) : (
    <Circle className="size-5 shrink-0 text-muted-foreground" aria-label="미완료" />
  )
}

export function CompleteLessonButton({ lesson }: { lesson: number }) {
  const { completed, pending, toggle } = useProgress()
  const done = completed.includes(lesson)
  return (
    <div className="flex justify-end border-t border-border pt-4">
      <button
        type="button"
        onClick={() => toggle(lesson)}
        disabled={pending !== null}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-semibold transition-colors disabled:opacity-60',
          done
            ? 'border border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive'
            : 'bg-primary text-primary-foreground hover:opacity-90',
        )}
      >
        {pending === lesson ? '저장 중...' : done ? '완료 취소' : (
          <>
            <CheckCircle2 className="size-3.5" /> 이 단계 학습 완료
          </>
        )}
      </button>
    </div>
  )
}
