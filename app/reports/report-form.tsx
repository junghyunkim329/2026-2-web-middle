'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormError } from '@/components/form-message'
import { apiFetch } from '@/lib/client-api'
import { LIMITS } from '@/lib/validators'

type ReportInput = { title: string; cveId: string; content: string }

// 리포트 작성/수정 공용 폼. reportId가 있으면 수정 모드.
export function ReportForm({
  reportId,
  initial,
}: {
  reportId?: string
  initial: ReportInput
}) {
  const router = useRouter()
  const [values, setValues] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const update = (key: keyof ReportInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setValues((v) => ({ ...v, [key]: e.target.value }))

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const result = await apiFetch<{ id: string }>(
      reportId ? `/api/reports/${reportId}` : '/api/reports',
      { method: reportId ? 'PATCH' : 'POST', body: values },
    )
    if (!result.ok) {
      setError(result.error)
      setPending(false)
      return
    }
    router.push(`/reports/${result.data.id}`)
    router.refresh()
  }

  const inputClass =
    'mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/60'

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-5">
      <label className="block">
        <span className="font-mono text-xs font-medium text-muted-foreground">제목</span>
        <input
          value={values.title}
          onChange={update('title')}
          required
          minLength={2}
          maxLength={LIMITS.reportTitleMax}
          placeholder="예: Log4Shell 원리 정리"
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="font-mono text-xs font-medium text-muted-foreground">
          관련 CVE ID <span className="text-muted-foreground/70">(선택)</span>
        </span>
        <input
          value={values.cveId}
          onChange={update('cveId')}
          maxLength={20}
          placeholder="CVE-2021-44228"
          className={`${inputClass} font-mono uppercase`}
        />
      </label>
      <label className="block">
        <span className="font-mono text-xs font-medium text-muted-foreground">내용</span>
        <textarea
          value={values.content}
          onChange={update('content')}
          required
          minLength={10}
          maxLength={LIMITS.reportContentMax}
          rows={16}
          placeholder={'공부한 내용을 자유롭게 정리해보세요.\n\n## 개요\n## 원인 분석\n## 재현/실습 과정\n## 대응 방안\n## 느낀 점'}
          className={`${inputClass} font-mono text-xs leading-relaxed`}
        />
        <span className="mt-1 block text-right font-mono text-[11px] text-muted-foreground">
          {values.content.length.toLocaleString()} / {LIMITS.reportContentMax.toLocaleString()}자
        </span>
      </label>

      <FormError message={error} />

      <div className="flex justify-end gap-2">
        <Link
          href={reportId ? `/reports/${reportId}` : '/reports'}
          className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground"
        >
          취소
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? '저장 중...' : reportId ? '수정 완료' : '저장'}
        </button>
      </div>
    </form>
  )
}
