'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Field } from '@/components/auth-shell'
import { FormError } from '@/components/form-message'
import { apiFetch } from '@/lib/client-api'
import { LIMITS, nicknameError, passwordError } from '@/lib/validators'

export function SignupForm({ next }: { next: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const nickname = String(form.get('nickname') ?? '').trim()
    const password = String(form.get('password') ?? '')

    // 브라우저에서 먼저 확인해 바로 알려준다. (서버에서도 똑같이 다시 검사한다)
    const clientError =
      nicknameError(nickname) ??
      passwordError(password) ??
      (password !== form.get('passwordConfirm') ? '비밀번호 확인이 일치하지 않습니다.' : null)
    if (clientError) {
      setError(clientError)
      return
    }

    setPending(true)
    setError(null)
    const result = await apiFetch('/api/auth/signup', {
      method: 'POST',
      body: {
        nickname,
        email: form.get('email'),
        password,
        agree: form.get('agree') === 'on',
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
        label="닉네임"
        name="nickname"
        placeholder="handle"
        hint="한글·영문·숫자·밑줄(_) 2~20자"
        autoComplete="nickname"
        maxLength={20}
        required
      />
      <Field
        label="이메일"
        name="email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        maxLength={LIMITS.emailMax}
        required
      />
      <Field
        label="비밀번호"
        name="password"
        type="password"
        placeholder="••••••••"
        hint="영문·숫자·특수문자 포함 10자 이상"
        autoComplete="new-password"
        maxLength={LIMITS.passwordMax}
        required
      />
      <Field
        label="비밀번호 확인"
        name="passwordConfirm"
        type="password"
        placeholder="••••••••"
        autoComplete="new-password"
        maxLength={LIMITS.passwordMax}
        required
      />

      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          name="agree"
          required
          className="mt-0.5 size-3.5 accent-[oklch(0.87_0.24_148)]"
        />
        <span>
          <a href="#" className="text-accent hover:underline">
            이용약관
          </a>{' '}
          및{' '}
          <a href="#" className="text-accent hover:underline">
            개인정보 처리방침
          </a>
          에 동의합니다.
        </span>
      </label>

      <FormError message={error} />

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? '가입 중...' : '계정 만들기'}
      </button>
    </form>
  )
}
