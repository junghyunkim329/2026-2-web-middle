import { ObjectId } from 'mongodb'
import { json, readJsonBody, requireUser, route } from '@/lib/api'
import { collections } from '@/lib/mongodb'
import { HttpError, LIMITS, isObjectIdString, requireText } from '@/lib/validators'

type Context = { params: Promise<{ id: string }> }

// 답변 등록
export const POST = route(async (request, { params }: Context) => {
  const user = await requireUser()
  const { id } = await params
  if (!isObjectIdString(id)) throw new HttpError(404, '질문을 찾을 수 없습니다.')
  const body = await readJsonBody(request)
  const content = requireText(body.body, '답변', { min: 2, max: LIMITS.answerBodyMax })

  const { questions, answers } = await collections()
  const questionId = new ObjectId(id)
  if (!(await questions.findOne({ _id: questionId }))) {
    throw new HttpError(404, '질문을 찾을 수 없습니다.')
  }

  const { insertedId } = await answers.insertOne({
    questionId,
    authorId: user._id,
    body: content,
    createdAt: new Date(),
  })
  await questions.updateOne({ _id: questionId }, { $inc: { answerCount: 1 } })
  return json({ id: insertedId.toHexString() }, 201)
})
