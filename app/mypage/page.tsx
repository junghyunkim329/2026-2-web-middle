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
        <span className="flex size-14 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
          <User className="size-7" />
        </span>
        <div>
          <h1 className="font-mono text-lg font-bold text-foreground">{user.nickname}</h1>
          <p className="text-sm text-muted-foreground">
            {user.email} · {formatDate(user.createdAt)} 가입
          </p>
        </div>
        <div className="ml-auto grid grid-cols-3 gap-2">
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
