import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DeleteButton } from '@/components/delete-button'
import { getCurrentUser } from '@/lib/auth'
import { timeAgo } from '@/lib/format'
import { getQuestionWithAnswers } from '@/lib/queries'
import { ArrowLeft, CheckCircle2, MessageSquare, Eye } from 'lucide-react'
import { AcceptButton } from './accept-button'
import { AnswerForm } from './answer-form'

export const dynamic = 'force-dynamic'

export default async function QnaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [user, data] = await Promise.all([getCurrentUser(), getQuestionWithAnswers(id)])
  if (!data) notFound()

  const { question, answers } = data
  const isQuestionAuthor = user?.id === question.authorId

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/qna"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-3.5" /> 질문 목록
      </Link>

      <div className="mt-4">
        <div className="flex items-start gap-2">
          {question.solved && <CheckCircle2 className="mt-1 size-5 shrink-0 text-primary" />}
          <h1 className="break-words text-pretty text-xl font-bold text-foreground">{question.title}</h1>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground">
          <span>@{question.author}</span>
          <span>{timeAgo(question.createdAt)}</span>
          <span className="flex items-center gap-1">
            <Eye className="size-3" /> {question.views}
          </span>
          {isQuestionAuthor && (
            <span className="ml-auto">
              <DeleteButton
                url={`/api/qna/${question.id}`}
                confirmMessage="질문을 삭제할까요? 달린 답변도 함께 삭제됩니다."
                redirectTo="/qna"
              />
            </span>
          )}
        </div>
        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
          {question.body}
        </p>
      </div>

      <h2 className="mt-8 flex items-center gap-2 border-b border-border pb-3 font-mono text-sm font-semibold text-foreground">
        <MessageSquare className="size-4 text-primary" /> 답변 {answers.length}개
      </h2>

      <div className="mt-4 space-y-4">
        {answers.length === 0 && <p className="text-sm text-muted-foreground">아직 답변이 없습니다.</p>}
        {answers.map((answer) => (
          <div
            key={answer.id}
            className={
              answer.accepted
                ? 'rounded-lg border border-primary/40 bg-primary/5 p-4'
                : 'rounded-lg border border-border bg-card p-4'
            }
          >
            {answer.accepted && (
              <span className="mb-2 inline-flex items-center gap-1 rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[11px] text-primary">
                <CheckCircle2 className="size-3" /> 채택된 답변
              </span>
            )}
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
              {answer.body}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground">
              <span>
                @{answer.author} · {timeAgo(answer.createdAt)}
              </span>
              <span className="ml-auto flex items-center gap-3">
                {isQuestionAuthor && !answer.accepted && (
                  <AcceptButton questionId={question.id} answerId={answer.id} />
                )}
                {user?.id === answer.authorId && (
                  <DeleteButton
                    url={`/api/qna/${question.id}/answers/${answer.id}`}
                    confirmMessage="답변을 삭제할까요?"
                  />
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="font-mono text-sm font-semibold text-foreground">답변 작성</h3>
        {user ? (
          <AnswerForm questionId={question.id} />
        ) : (
          <p className="mt-3 rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            답변을 작성하려면{' '}
            <Link
              href={`/login?next=${encodeURIComponent(`/qna/${question.id}`)}`}
              className="font-medium text-primary hover:underline"
            >
              로그인
            </Link>
            하세요.
          </p>
        )}
      </div>
    </div>
  )
}
