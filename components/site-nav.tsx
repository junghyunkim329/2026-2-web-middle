'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, Shield, User, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/', label: '홈' },
  { href: '/cves', label: 'CVE 목록' },
  { href: '/learn', label: '취약점 학습' },
  { href: '/lab', label: '실습' },
  { href: '/compare', label: 'CVE 비교' },
  { href: '/qna', label: '질의응답' },
]

export function SiteNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

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
          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            로그인
          </Link>
          <Link
            href="/mypage"
            className="flex items-center gap-2 rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <User className="size-4" />
            마이페이지
          </Link>
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
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-md border border-border px-3 py-2 text-center text-sm font-medium"
              >
                로그인
              </Link>
              <Link
                href="/mypage"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-center text-sm font-medium text-primary"
              >
                마이페이지
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
