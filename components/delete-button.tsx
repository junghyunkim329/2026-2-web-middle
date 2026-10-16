'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { apiFetch } from '@/lib/client-api'

// 확인 창을 띄운 뒤 DELETE 요청을 보내는 버튼.
// redirectTo가 있으면 삭제 후 그 페이지로, 없으면 현재 페이지를 새로고침한다.
export function DeleteButton({
  url,
  confirmMessage,
  redirectTo,
  label = '삭제',
}: {
  url: string
  confirmMessage: string
  redirectTo?: string
  label?: string
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleClick() {
    if (!confirm(confirmMessage)) return
    setPending(true)
    const result = await apiFetch(url, { method: 'DELETE' })
    if (!result.ok) {
      alert(result.error)
      setPending(false)
      return
    }
    if (redirectTo) router.push(redirectTo)
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-destructive disabled:opacity-60"
    >
      <Trash2 className="size-3.5" /> {pending ? '삭제 중...' : label}
    </button>
  )
}
