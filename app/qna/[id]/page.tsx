import Link from 'next/link'
import { notFound } from 'next/navigation'
import { QNA } from '@/lib/mock-data'
import {
  ArrowLeft,
  CheckCircle2,
  MessageSquare,
  Eye,
} from 'lucide-react'

export function generateStaticParams() {
  return QNA.map((q) => ({ id: String(q.id) }))
}

const ANSWERS = [
  {
    author: 'incident_lead',
    accepted: true,
    votes: 9,
    time: '1시간 전',
    body: 'JVM 옵션(formatMsgNoLookups)은 2.10 이상에서만 유효하며, 그 미만 버전에서는 JndiLookup 클래스를 제거하는 것이 확실합니다. 근본적으로는 2.17.x 이상으로 업그레이드하는 것을 권장합니다. 완화책만으로는 후속 우회(CVE-2021-45046 등) 가능성이 남습니다.',
  },
  {
    author: 'blue_team',
    accepted: false,
    votes: 3,
    time: '40분 전',
    body: '탐지 관점에서는 아웃바운드 LDAP/RMI 연결을 모니터링하고, 요청 헤더/파라미터의 jndi: 패턴을 WAF에서 차단하세요. 임시 완화와 병행하는 것을 권장합니다.',
  },
]

export default async function QnaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const q = QNA.find((x) => x.id === Number(id))
  if (!q) notFound()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/qna"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-3.5" /> 질문 목록
      </Link>

      {/* question */}
      <div className="mt-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            {q.solved && <CheckCircle2 className="mt-1 size-5 shrink-0 text-primary" />}
            <h1 className="text-pretty text-xl font-bold text-foreground">{q.title}</h1>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground">
            <span>@{q.author}</span>
            <span>{q.createdAt}</span>
            <span className="flex items-center gap-1">
              <Eye className="size-3" /> {q.views}
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-foreground">{q.excerpt}</p>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            현재 운영 중인 서비스는 다수의 Log4j 버전이 혼재되어 있고, 즉시 재배포가 어려운 레거시
            컴포넌트가 포함되어 있습니다. 가용한 완화책의 우선순위와 확실한 검증 방법을 알고 싶습니다.
          </p>
        </div>
      </div>

      {/* answers */}
      <h2 className="mt-8 flex items-center gap-2 border-b border-border pb-3 font-mono text-sm font-semibold text-foreground">
        <MessageSquare className="size-4 text-primary" /> 답변 {q.answers}개
      </h2>

      <div className="mt-4 space-y-4">
        {ANSWERS.map((a, i) => (
          <div
            key={i}
            className={
              a.accepted
                ? 'flex gap-4 rounded-lg border border-primary/40 bg-primary/5 p-4'
                : 'flex gap-4 rounded-lg border border-border bg-card p-4'
            }
          >
            <div className="min-w-0 flex-1">
              {a.accepted && (
                <span className="mb-2 inline-flex items-center gap-1 rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[11px] text-primary">
                  <CheckCircle2 className="size-3" /> 채택된 답변
                </span>
              )}
              <p className="text-sm leading-relaxed text-foreground">{a.body}</p>
              <div className="mt-3 font-mono text-[11px] text-muted-foreground">
                @{a.author} · {a.time}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* answer form */}
      <div className="mt-8">
        <h3 className="font-mono text-sm font-semibold text-foreground">답변 작성</h3>
        <textarea
          rows={5}
          placeholder="근거와 함께 답변을 작성해주세요. 코드/명령은 백틱으로 감싸면 좋습니다."
          className="mt-3 w-full resize-none rounded-md border border-input bg-background p-3 text-sm outline-none focus:border-primary/60"
        />
        <div className="mt-3 flex justify-end">
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            답변 등록
          </button>
        </div>
      </div>
    </div>
  )
}

