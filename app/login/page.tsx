'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthShell, Field, AuthDivider } from '@/components/auth-shell'
import { KeyRound } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    document.cookie = 'cvehub_session=1; path=/; max-age=604800; samesite=lax'
    router.push('/mypage')
  }
  return (
    <AuthShell title="로그인" subtitle="CVEHUB 계정으로 계속하기">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label="이메일" type="email" placeholder="you@example.com" />
        <Field label="비밀번호" type="password" placeholder="••••••••" />

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" className="size-3.5 accent-[oklch(0.87_0.24_148)]" />
            로그인 유지
          </label>
          <a href="#" className="font-mono text-accent hover:text-primary">
            비밀번호 찾기
          </a>
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          로그인
        </button>
      </form>

      <AuthDivider />

      <button className="flex w-full items-center justify-center gap-2 rounded-md border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent/50">
        <KeyRound className="size-4" /> SSO로 계속하기
      </button>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          회원가입
        </Link>
      </p>
    </AuthShell>
  )
}
