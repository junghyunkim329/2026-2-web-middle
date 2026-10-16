import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// 폼 아래에 보여주는 에러 메시지
export function FormError({ message, className }: { message: string | null; className?: string }) {
  if (!message) return null
  return (
    <p
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive',
        className,
      )}
    >
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  )
}
