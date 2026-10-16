import { ObjectId } from 'mongodb'
import { json, readJsonBody, requireUser, route } from '@/lib/api'
import { collections } from '@/lib/mongodb'
import { HttpError, isObjectIdString, readReportInput } from '@/lib/validators'

type Context = { params: Promise<{ id: string }> }

// 본인 리포트인지 확인한 뒤 _id를 돌려준다.
async function findOwnReport(id: string, userId: ObjectId) {
  if (!isObjectIdString(id)) throw new HttpError(404, '리포트를 찾을 수 없습니다.')
  const { reports } = await collections()
  const report = await reports.findOne({ _id: new ObjectId(id) })
  if (!report) throw new HttpError(404, '리포트를 찾을 수 없습니다.')
  if (!report.authorId.equals(userId)) throw new HttpError(403, '본인이 작성한 리포트만 수정·삭제할 수 있습니다.')
  return report._id
}

// 리포트 수정
export const PATCH = route(async (request, { params }: Context) => {
  const user = await requireUser()
  const _id = await findOwnReport((await params).id, user._id)
  const input = readReportInput(await readJsonBody(request))

  const { reports } = await collections()
  await reports.updateOne({ _id }, { $set: { ...input, updatedAt: new Date() } })
  return json({ id: _id.toHexString() })
})

// 리포트 삭제
export const DELETE = route(async (_request, { params }: Context) => {
  const user = await requireUser()
  const _id = await findOwnReport((await params).id, user._id)

  const { reports } = await collections()
  await reports.deleteOne({ _id })
  return json({ ok: true })
})
