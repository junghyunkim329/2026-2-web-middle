import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/auth-shell'
import { getCurrentUser } from '@/lib/auth'
import { safeNextPath } from '@/lib/validators'
import { LoginForm } from './login-form'

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const next = safeNextPath((await searchParams).next)
  if (await getCurrentUser()) redirect(next)

  return (
    <AuthShell title="로그인" subtitle="CVEHUB 계정으로 계속하기">
      <LoginForm next={next} />

      <p className="mt-5 text-center text-sm text-muted-foreground">
        계정이 없으신가요?{' '}
        <Link
          href={`/signup?next=${encodeURIComponent(next)}`}
          className="font-medium text-primary hover:underline"
        >
          회원가입
        </Link>
      </p>
    </AuthShell>
  )
}
