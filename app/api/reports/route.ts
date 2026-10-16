import { json, readJsonBody, requireUser, route } from '@/lib/api'
import { collections } from '@/lib/mongodb'
import { readReportInput } from '@/lib/validators'

// 원데이 리포트(학습 기록) 작성
export const POST = route(async (request) => {
  const user = await requireUser()
  const input = readReportInput(await readJsonBody(request))

  const { reports } = await collections()
  const now = new Date()
  const { insertedId } = await reports.insertOne({
    ...input,
    authorId: user._id,
    createdAt: now,
    updatedAt: now,
  })
  return json({ id: insertedId.toHexString() }, 201)
})
