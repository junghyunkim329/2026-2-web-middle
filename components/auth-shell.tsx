import Link from 'next/link'
import { Shield } from 'lucide-react'

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-xl border border-primary/50 bg-primary/10 text-primary box-glow">
            <Shield className="size-6" />
          </span>
          <h1 className="mt-4 font-mono text-2xl font-bold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card p-6">{children}</div>

        <p className="mt-6 text-center font-mono text-[11px] leading-relaxed text-muted-foreground">
          로그인하면 AI 분석·원데이 리포트·CVE 저장 기능을 이용할 수 있습니다.
        </p>
      </div>
    </div>
  )
}

export function Field({
  label,
  type = 'text',
  placeholder,
  hint,
}: {
  label: string
  type?: string
  placeholder?: string
  hint?: string
}) {
  return (
    <label className="block">
      <span className="font-mono text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
      />
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  )
}

export function AuthDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="font-mono text-[11px] text-muted-foreground">또는</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

export { Link }
