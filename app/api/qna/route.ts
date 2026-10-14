import { json, readJsonBody, requireUser, route } from '@/lib/api'
import { collections } from '@/lib/mongodb'
import { LIMITS, requireText } from '@/lib/validators'

// 질문 등록
export const POST = route(async (request) => {
  const user = await requireUser()
  const body = await readJsonBody(request)
  const title = requireText(body.title, '제목', { min: 2, max: LIMITS.questionTitleMax })
  const content = requireText(body.body, '내용', { min: 5, max: LIMITS.questionBodyMax })

  const { questions } = await collections()
  const { insertedId } = await questions.insertOne({
    title,
    body: content,
    authorId: user._id,
    views: 0,
    answerCount: 0,
    acceptedAnswerId: null,
    createdAt: new Date(),
  })
  return json({ id: insertedId.toHexString() }, 201)
})
