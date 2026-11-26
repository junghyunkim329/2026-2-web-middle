import { redirect } from 'next/navigation'
import { StatPill } from '@/components/cve-bits'
import { getCurrentUser } from '@/lib/auth'
import { formatDate } from '@/lib/format'
import { listFavorites, listQuestions, listReports } from '@/lib/queries'
import { User } from 'lucide-react'
import { MyPageTabs } from './mypage-tabs'

export const dynamic = 'force-dynamic'

export default async function MyPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/mypage')

  const [favorites, reports, questions] = await Promise.all([
    listFavorites(user._id),
    listReports({ authorId: user._id, limit: 100 }),
    listQuestions({ authorId: user._id, limit: 100 }),
  ])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-5">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
          <User className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-mono text-lg font-bold text-foreground">{user.nickname}</h1>
          <p className="text-sm text-muted-foreground">
            <span className="break-all">{user.email}</span>
            <span className="hidden sm:inline"> · </span>
            <span className="block sm:inline">{formatDate(user.createdAt)} 가입</span>
          </p>
        </div>
        <div className="grid w-full grid-cols-3 gap-2 sm:ml-auto sm:w-auto">
          <StatPill label="저장" value={String(favorites.length)} tone="primary" />
          <StatPill label="리포트" value={String(reports.length)} tone="accent" />
          <StatPill label="질문" value={String(questions.length)} tone="warning" />
        </div>
      </div>

      <MyPageTabs
        nickname={user.nickname}
        favorites={favorites.map((favorite) => ({
          cveId: favorite.cveId,
          savedAt: formatDate(favorite.createdAt),
        }))}
        reports={reports.map((report) => ({
          id: report.id,
          title: report.title,
          cveId: report.cveId,
          date: formatDate(report.updatedAt),
        }))}
        questions={questions.map((question) => ({
          id: question.id,
          title: question.title,
          solved: question.solved,
          answerCount: question.answerCount,
          date: formatDate(question.createdAt),
        }))}
      />
    </div>
  )
}
