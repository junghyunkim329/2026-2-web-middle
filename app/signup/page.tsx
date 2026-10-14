import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/auth-shell'
import { getCurrentUser } from '@/lib/auth'
import { safeNextPath } from '@/lib/validators'
import { Check } from 'lucide-react'
import { SignupForm } from './signup-form'

export const dynamic = 'force-dynamic'

const PERKS = [
  'CVE 즐겨찾기 저장',
  '원데이 리포트로 공부한 내용 기록',
  '질의응답 게시판에서 질문·답변 작성',
]

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const next = safeNextPath((await searchParams).next)
  if (await getCurrentUser()) redirect(next)

  return (
    <AuthShell title="회원가입" subtitle="무료로 시작하고 AI 분석을 이용하세요">
      <div className="mb-5 space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
        {PERKS.map((p) => (
          <div key={p} className="flex items-start gap-2 text-xs text-foreground">
            <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span>{p}</span>
          </div>
        ))}
      </div>

      <SignupForm next={next} />

      <p className="mt-5 text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{' '}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="font-medium text-primary hover:underline"
        >
          로그인
        </Link>
      </p>
    </AuthShell>
  )
}
