'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Field } from '@/components/auth-shell'
import { FormError } from '@/components/form-message'
import { apiFetch } from '@/lib/client-api'

export function LoginForm({ next }: { next: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    setError(null)

    const result = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: form.get('email'),
        password: form.get('password'),
        remember: form.get('remember') === 'on',
      },
    })
    if (!result.ok) {
      setError(result.error)
      setPending(false)
      return
    }
    router.replace(next)
    router.refresh()
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Field
        label="이메일"
        name="email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        required
      />
      <Field
        label="비밀번호"
        name="password"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />

      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          name="remember"
          className="size-3.5 accent-[oklch(0.87_0.24_148)]"
        />
        로그인 유지 (30일)
      </label>

      <FormError message={error} />

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? '로그인 중...' : '로그인'}
      </button>
    </form>
  )
}
