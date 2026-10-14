'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogOut, Menu, Shield, User, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/client-api'

const NAV = [
  { href: '/', label: '홈' },
  { href: '/cves', label: 'CVE 목록' },
  { href: '/learn', label: '취약점 학습' },
  { href: '/lab', label: '실습' },
  { href: '/compare', label: 'CVE 비교' },
  { href: '/qna', label: '질의응답' },
  { href: '/reports', label: '원데이 리포트' },
]

type NavUser = { nickname: string } | null

export const AUTH_CHANGE_EVENT = 'cvehub:auth-change'

export function SiteNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  // undefined: 확인 중, null: 로그아웃 상태
  const [user, setUser] = useState<NavUser | undefined>(undefined)

  const [refreshKey, setRefreshKey] = useState(0)

  // 페이지를 옮길 때마다 로그인 상태를 다시 확인한다. (로그인·로그아웃 직후 반영)
  useEffect(() => {
    let cancelled = false
    apiFetch<{ user: NavUser }>('/api/auth/me').then((result) => {
      if (!cancelled) setUser(result.ok ? result.data.user : null)
    })
    return () => {
      cancelled = true
    }
  }, [pathname, refreshKey])

  // 마이페이지에서 닉네임을 바꾸면 메뉴의 닉네임도 바로 바꾼다.
  useEffect(() => {
    const onChange = () => setRefreshKey((k) => k + 1)
    window.addEventListener(AUTH_CHANGE_EVENT, onChange)
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, onChange)
  }, [])

  async function logout() {
    await apiFetch('/api/auth/logout', { method: 'POST' })
    window.location.assign('/')
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md border border-primary/50 bg-primary/10 text-primary box-glow">
            <Shield className="size-4" />
          </span>
          <span className="font-mono text-lg font-bold tracking-tight text-primary text-glow">
            CVEHUB
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user === null && (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
              >
                회원가입
              </Link>
            </>
          )}
          {user && (
            <>
              <Link
                href="/mypage"
                className="flex items-center gap-2 rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
              >
                <User className="size-4" />
                {user.nickname}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                aria-label="로그아웃"
                title="로그아웃"
              >
                <LogOut className="size-4" />
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex size-9 items-center justify-center rounded-md border border-border text-foreground md:hidden"
          aria-label="메뉴 열기"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium',
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary',
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-border pt-3">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex-1 rounded-md border border-border px-3 py-2 text-center text-sm font-medium"
                  >
                    로그아웃
                  </button>
                  <Link
                    href="/mypage"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-center text-sm font-medium text-primary"
                  >
                    마이페이지
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-md border border-border px-3 py-2 text-center text-sm font-medium"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-center text-sm font-medium text-primary"
                  >
                    회원가입
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
