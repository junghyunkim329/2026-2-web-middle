'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormError } from '@/components/form-message'
import { AUTH_CHANGE_EVENT } from '@/components/site-nav'
import { apiFetch } from '@/lib/client-api'
import { nicknameError, normalizeCveId } from '@/lib/validators'
import { cn } from '@/lib/utils'
import {
  Bookmark,
  CheckCircle2,
  FileText,
  LogOut,
  MessageSquare,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react'

type Tab = 'saved' | 'reports' | 'questions' | 'settings'

const TABS: { id: Tab; label: string; icon: typeof Bookmark }[] = [
  { id: 'saved', label: '저장 · 즐겨찾기', icon: Bookmark },
  { id: 'reports', label: '내 리포트', icon: FileText },
  { id: 'questions', label: '내 질문', icon: MessageSquare },
  { id: 'settings', label: '계정 설정', icon: Settings },
]

type Favorite = { cveId: string; savedAt: string }
type MyReport = { id: string; title: string; cveId: string | null; date: string }
type MyQuestion = { id: string; title: string; solved: boolean; answerCount: number; date: string }

export function MyPageTabs({
  nickname,
  favorites,
  reports,
  questions,
}: {
  nickname: string
  favorites: Favorite[]
  reports: MyReport[]
  questions: MyQuestion[]
}) {
  const [tab, setTab] = useState<Tab>('saved')

  return (
    <>
      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <t.icon className="size-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'saved' && <SavedTab favorites={favorites} />}
        {tab === 'reports' && <ReportsTab reports={reports} />}
        {tab === 'questions' && <QuestionsTab questions={questions} />}
        {tab === 'settings' && <SettingsTab nickname={nickname} />}
      </div>
    </>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  )
}

function SavedTab({ favorites }: { favorites: Favorite[] }) {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cveId = normalizeCveId(input)
    if (!cveId) {
      setError('CVE ID 형식이 올바르지 않습니다. (예: CVE-2024-3094)')
      return
    }
    setPending(true)
    setError(null)
    const result = await apiFetch(`/api/favorites/${cveId}`, { method: 'PUT' })
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setInput('')
    router.refresh()
  }

  async function remove(cveId: string) {
    const result = await apiFetch(`/api/favorites/${cveId}`, { method: 'DELETE' })
    if (!result.ok) alert(result.error)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <form onSubmit={add} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={20}
          placeholder="CVE ID로 추가 (예: CVE-2021-44228)"
          className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm uppercase outline-none placeholder:normal-case focus:border-primary/60"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-60"
        >
          <Plus className="size-4" /> 추가
        </button>
      </form>
      <FormError message={error} />

      {favorites.length === 0 && (
        <EmptyState>
          저장한 CVE가 없습니다. CVE 상세 페이지의 <b>저장</b> 버튼이나 위 입력창으로 추가하세요.
        </EmptyState>
      )}
      {favorites.map((f) => (
        <div
          key={f.cveId}
          className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4"
        >
          <Bookmark className="size-4 text-primary" />
          <Link
            href={`/cve/${f.cveId}`}
            className="font-mono text-sm font-bold text-accent hover:text-primary"
          >
            {f.cveId}
          </Link>
          <span className="ml-auto font-mono text-[11px] text-muted-foreground">{f.savedAt} 저장</span>
          <button
            onClick={() => remove(f.cveId)}
            className="text-muted-foreground transition-colors hover:text-destructive"
            aria-label={`${f.cveId} 즐겨찾기 해제`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

function ReportsTab({ reports }: { reports: MyReport[] }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">CVE를 공부하며 정리한 내 원데이 리포트입니다.</p>
        <Link
          href="/reports/new"
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <Plus className="size-4" /> 새 리포트
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {reports.length === 0 && <EmptyState>아직 작성한 리포트가 없습니다.</EmptyState>}
        {reports.map((r) => (
          <Link
            key={r.id}
            href={`/reports/${r.id}`}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent/50"
          >
            <FileText className="size-4 text-accent" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {r.cveId ? `${r.cveId} · ` : ''}갱신 {r.date}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function QuestionsTab({ questions }: { questions: MyQuestion[] }) {
  return (
    <div className="space-y-3">
      {questions.length === 0 && (
        <EmptyState>
          아직 작성한 질문이 없습니다.{' '}
          <Link href="/qna" className="text-primary hover:underline">
            질의응답
          </Link>
          에서 질문해보세요.
        </EmptyState>
      )}
      {questions.map((q) => (
        <Link
          key={q.id}
          href={`/qna/${q.id}`}
          className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent/50"
        >
          {q.solved ? (
            <CheckCircle2 className="size-4 text-primary" />
          ) : (
            <MessageSquare className="size-4 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{q.title}</p>
            <p className="font-mono text-[11px] text-muted-foreground">
              답변 {q.answerCount}개 · {q.date}
            </p>
          </div>
          <span
            className={cn(
              'rounded border px-2 py-0.5 font-mono text-[11px]',
              q.solved
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-warning/40 bg-warning/10 text-warning',
            )}
          >
            {q.solved ? '해결됨' : '미해결'}
          </span>
        </Link>
      ))}
    </div>
  )
}

function SettingsTab({ nickname }: { nickname: string }) {
  const router = useRouter()
  const [value, setValue] = useState(nickname)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = value.trim()
    const clientError = nicknameError(next)
    if (clientError) {
      setError(clientError)
      return
    }
    setPending(true)
    setError(null)
    setSaved(false)
    const result = await apiFetch('/api/me', { method: 'PATCH', body: { nickname: next } })
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSaved(true)
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
    router.refresh()
  }

  async function logout() {
    await apiFetch('/api/auth/logout', { method: 'POST' })
    window.location.assign('/')
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <form onSubmit={save} className="rounded-lg border border-border bg-card p-5">
        <h3 className="font-mono text-sm font-semibold text-foreground">닉네임 수정</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          질의응답과 리포트에 표시되는 이름입니다. 한글·영문·숫자·밑줄(_) 2~20자.
        </p>
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setSaved(false)
          }}
          maxLength={20}
          required
          className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
        />
        <FormError message={error} className="mt-2" />
        {saved && <p className="mt-2 text-xs text-primary">닉네임이 변경되었습니다.</p>}
        <button
          type="submit"
          disabled={pending || value.trim() === nickname}
          className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? '저장 중...' : '저장'}
        </button>
      </form>

      <div className="flex flex-col justify-between rounded-lg border border-border bg-card p-5">
        <div>
          <h3 className="font-mono text-sm font-semibold text-foreground">로그아웃</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            이 브라우저의 로그인 세션을 종료합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-4 flex items-center justify-center gap-2 rounded-md border border-border py-2 text-sm font-medium text-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
        >
          <LogOut className="size-4" /> 로그아웃
        </button>
      </div>
    </div>
  )
}
