'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormError } from '@/components/form-message'
import { apiFetch } from '@/lib/client-api'
import { LIMITS } from '@/lib/validators'

export function AnswerForm({ questionId }: { questionId: string }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const result = await apiFetch(`/api/qna/${questionId}/answers`, {
      method: 'POST',
      body: { body },
    })
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setBody('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
        required
        minLength={2}
        maxLength={LIMITS.answerBodyMax}
        placeholder="근거와 함께 답변을 작성해주세요. 코드/명령은 백틱으로 감싸면 좋습니다."
        className="mt-3 w-full resize-none rounded-md border border-input bg-background p-3 text-sm outline-none focus:border-primary/60"
      />
      <FormError message={error} className="mt-2" />
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? '등록 중...' : '답변 등록'}
        </button>
      </div>
    </form>
  )
}
