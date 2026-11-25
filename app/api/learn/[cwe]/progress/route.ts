// app/api/learn/[cwe]/progress/route.ts — CWE 커리큘럼 단계 완료 표시/해제 (PUT { lesson, done })
import { json, readJsonBody, requireUser, route } from '@/lib/api'
import { getCurriculum } from '@/lib/curriculum'
import { getCwe } from '@/lib/mock-data'
import { collections } from '@/lib/mongodb'
import { HttpError } from '@/lib/validators'

type Context = { params: Promise<{ cwe: string }> }

export const PUT = route(async (request, { params }: Context) => {
  const user = await requireUser()
  const cwe = getCwe(decodeURIComponent((await params).cwe))
  if (!cwe) throw new HttpError(404, '학습 과정이 없는 CWE입니다.')

  const body = await readJsonBody(request)
  const lessons = getCurriculum(cwe.id)
  const lesson = body.lesson
  if (typeof lesson !== 'number' || !Number.isInteger(lesson) || !lessons[lesson]?.summary) {
    throw new HttpError(400, '학습 단계 번호가 올바르지 않습니다.')
  }
  if (typeof body.done !== 'boolean') throw new HttpError(400, '완료 여부가 올바르지 않습니다.')

  const { learningProgress } = await collections()
  const result = await learningProgress.findOneAndUpdate(
    { userId: user._id, cweId: cwe.id },
    {
      ...(body.done ? { $addToSet: { completed: lesson } } : { $pull: { completed: lesson } }),
      $set: { updatedAt: new Date() },
    },
    { upsert: true, returnDocument: 'after' },
  )
  const completed = (result?.completed ?? []).filter((n) => Boolean(lessons[n]?.summary)).sort((a, b) => a - b)
  return json({ completed })
})
