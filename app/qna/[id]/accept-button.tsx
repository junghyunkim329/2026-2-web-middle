'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { apiFetch } from '@/lib/client-api'

// 질문 작성자에게만 보이는 '채택' 버튼
export function AcceptButton({ questionId, answerId }: { questionId: string; answerId: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleClick() {
    if (!confirm('이 답변을 채택할까요?')) return
    setPending(true)
    const result = await apiFetch(`/api/qna/${questionId}/accept`, {
      method: 'POST',
      body: { answerId },
    })
    setPending(false)
    if (!result.ok) {
      alert(result.error)
      return
    }
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-1 rounded border border-primary/40 px-2 py-0.5 font-mono text-[11px] text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
    >
      <CheckCircle2 className="size-3" /> 채택하기
    </button>
  )
}
