import { ObjectId } from 'mongodb'
import { json, requireUser, route } from '@/lib/api'
import { collections } from '@/lib/mongodb'
import { HttpError, isObjectIdString } from '@/lib/validators'

type Context = { params: Promise<{ id: string }> }

// 질문 삭제 (작성자만) — 달린 답변도 함께 지운다.
export const DELETE = route(async (_request, { params }: Context) => {
  const user = await requireUser()
  const { id } = await params
  if (!isObjectIdString(id)) throw new HttpError(404, '질문을 찾을 수 없습니다.')

  const { questions, answers } = await collections()
  const questionId = new ObjectId(id)
  const question = await questions.findOne({ _id: questionId })
  if (!question) throw new HttpError(404, '질문을 찾을 수 없습니다.')
  // 다른 사람의 글을 지우지 못하게 서버에서 작성자를 확인한다. (화면에서 버튼을 숨기는 것만으로는 부족)
  if (!question.authorId.equals(user._id)) throw new HttpError(403, '본인이 작성한 질문만 삭제할 수 있습니다.')

  await answers.deleteMany({ questionId })
  await questions.deleteOne({ _id: questionId })
  return json({ ok: true })
})
