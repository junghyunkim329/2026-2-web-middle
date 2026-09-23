import Link from 'next/link'
import { AuthShell, Field } from '@/components/auth-shell'
import { Check } from 'lucide-react'

const PERKS = [
  'AI 기반 CVE 검색·분석 (일일 한도 내 무제한 질의)',
  'CVE 저장 및 즐겨찾기',
  '원데이 리포트 작성 + AI 초안 생성',
  '실습 랩 진행 상황 저장',
]

export default function SignupPage() {
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

      <form className="space-y-4">
        <Field label="닉네임" placeholder="handle" />
        <Field label="이메일" type="email" placeholder="you@example.com" />
        <Field
          label="비밀번호"
          type="password"
          placeholder="••••••••"
          hint="영문·숫자·특수문자 포함 10자 이상"
        />
        <Field label="비밀번호 확인" type="password" placeholder="••••••••" />

        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input type="checkbox" className="mt-0.5 size-3.5 accent-[oklch(0.87_0.24_148)]" />
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

        <button
          type="submit"
          className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          계정 만들기
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          로그인
        </Link>
      </p>
    </AuthShell>
  )
}
