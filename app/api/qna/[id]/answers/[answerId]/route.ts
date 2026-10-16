import { ObjectId } from 'mongodb'
import { json, requireUser, route } from '@/lib/api'
import { collections } from '@/lib/mongodb'
import { HttpError, isObjectIdString } from '@/lib/validators'

type Context = { params: Promise<{ id: string; answerId: string }> }

// 답변 삭제 (답변 작성자만)
export const DELETE = route(async (_request, { params }: Context) => {
  const user = await requireUser()
  const { id, answerId } = await params
  if (!isObjectIdString(id) || !isObjectIdString(answerId)) {
    throw new HttpError(404, '답변을 찾을 수 없습니다.')
  }

  const { questions, answers } = await collections()
  const questionId = new ObjectId(id)
  const _id = new ObjectId(answerId)
  const answer = await answers.findOne({ _id, questionId })
  if (!answer) throw new HttpError(404, '답변을 찾을 수 없습니다.')
  if (!answer.authorId.equals(user._id)) throw new HttpError(403, '본인이 작성한 답변만 삭제할 수 있습니다.')

  await answers.deleteOne({ _id })
  await questions.updateOne({ _id: questionId }, { $inc: { answerCount: -1 } })
  // 채택된 답변이 지워지면 질문을 다시 미해결 상태로 돌린다.
  await questions.updateOne(
    { _id: questionId, acceptedAnswerId: _id },
    { $set: { acceptedAnswerId: null } },
  )
  return json({ ok: true })
})
