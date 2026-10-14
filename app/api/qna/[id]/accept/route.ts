import { ObjectId } from 'mongodb'
import { json, readJsonBody, requireUser, route } from '@/lib/api'
import { collections } from '@/lib/mongodb'
import { HttpError, isObjectIdString } from '@/lib/validators'

type Context = { params: Promise<{ id: string }> }

// 답변 채택 (질문 작성자만). 채택하면 질문이 '해결됨'이 된다.
export const POST = route(async (request, { params }: Context) => {
  const user = await requireUser()
  const { id } = await params
  const body = await readJsonBody(request)
  if (!isObjectIdString(id)) throw new HttpError(404, '질문을 찾을 수 없습니다.')
  if (!isObjectIdString(body.answerId)) throw new HttpError(400, '채택할 답변을 선택해주세요.')

  const { questions, answers } = await collections()
  const questionId = new ObjectId(id)
  const answerId = new ObjectId(body.answerId)

  const question = await questions.findOne({ _id: questionId })
  if (!question) throw new HttpError(404, '질문을 찾을 수 없습니다.')
  if (!question.authorId.equals(user._id)) throw new HttpError(403, '질문 작성자만 답변을 채택할 수 있습니다.')
  if (!(await answers.findOne({ _id: answerId, questionId }))) {
    throw new HttpError(404, '답변을 찾을 수 없습니다.')
  }

  await questions.updateOne({ _id: questionId }, { $set: { acceptedAnswerId: answerId } })
  return json({ ok: true })
})
