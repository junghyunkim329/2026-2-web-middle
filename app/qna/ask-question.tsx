'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { FormError } from '@/components/form-message'
import { apiFetch } from '@/lib/client-api'
import { LIMITS } from '@/lib/validators'

// 페이지 제목(children) 옆의 질문하기 버튼 + 작성 폼
export function AskQuestion({
  loggedIn,
  children,
}: {
  loggedIn: boolean
  children: React.ReactNode
}) {
  const router = useRouter()
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    setError(null)
    const result = await apiFetch<{ id: string }>('/api/qna', {
      method: 'POST',
      body: { title: form.get('title'), body: form.get('body') },
    })
    if (!result.ok) {
      setError(result.error)
      setPending(false)
      return
    }
    router.push(`/qna/${result.data.id}`)
  }

  const buttonClass =
    'flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90'

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>{children}</div>
        {loggedIn ? (
          <button type="button" onClick={() => setAsking((v) => !v)} className={buttonClass}>
            <Plus className="size-4" /> 질문하기
          </button>
        ) : (
          <Link href="/login?next=/qna" className={buttonClass}>
            <Plus className="size-4" /> 로그인하고 질문하기
          </Link>
        )}
      </div>

      {asking && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 rounded-lg border border-primary/30 bg-card p-4 box-glow"
        >
          <input
            name="title"
            required
            minLength={2}
            maxLength={LIMITS.questionTitleMax}
            placeholder="질문 제목을 입력하세요"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
          <textarea
            name="body"
            rows={5}
            required
            minLength={5}
            maxLength={LIMITS.questionBodyMax}
            placeholder="상황과 시도한 내용을 구체적으로 작성해주세요."
            className="mt-2 w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus:border-primary/60"
          />
          <FormError message={error} className="mt-2" />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAsking(false)}
              className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {pending ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      )}
    </>
  )
}
