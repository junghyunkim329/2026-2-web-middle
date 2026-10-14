'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { apiFetch } from '@/lib/client-api'
import { cn } from '@/lib/utils'

// CVE 상세 페이지의 즐겨찾기(저장) 버튼
export function FavoriteButton({ cveId }: { cveId: string }) {
  const router = useRouter()
  const [state, setState] = useState<{ loggedIn: boolean; favorited: boolean } | null>(null)
  const [pending, setPending] = useState(false)
  const url = `/api/favorites/${encodeURIComponent(cveId)}`

  useEffect(() => {
    apiFetch<{ loggedIn: boolean; favorited: boolean }>(url).then((result) => {
      setState(result.ok ? result.data : { loggedIn: false, favorited: false })
    })
  }, [url])

  async function toggle() {
    if (!state?.loggedIn) {
      router.push(`/login?next=${encodeURIComponent(`/cve/${cveId}`)}`)
      return
    }
    setPending(true)
    const result = await apiFetch<{ favorited: boolean }>(url, {
      method: state.favorited ? 'DELETE' : 'PUT',
    })
    if (result.ok) setState({ loggedIn: true, favorited: result.data.favorited })
    else alert(result.error)
    setPending(false)
  }

  const favorited = state?.favorited ?? false
  const Icon = favorited ? BookmarkCheck : Bookmark

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending || state === null}
      aria-pressed={favorited}
      className={cn(
        'flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60',
        favorited
          ? 'border-primary bg-primary text-primary-foreground hover:opacity-90'
          : 'border-primary/50 bg-primary/10 text-primary hover:bg-primary/20',
      )}
    >
      <Icon className="size-4" /> {favorited ? '저장됨' : '저장'}
    </button>
  )
}
