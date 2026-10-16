import { MongoServerError } from 'mongodb'
import { json, readJsonBody, requireUser, route } from '@/lib/api'
import { collections } from '@/lib/mongodb'
import { HttpError, validateNickname } from '@/lib/validators'

// 닉네임 수정
export const PATCH = route(async (request) => {
  const user = await requireUser()
  const body = await readJsonBody(request)
  const nickname = validateNickname(body.nickname)
  if (nickname === user.nickname) return json({ nickname })

  const { users } = await collections()
  if (await users.findOne({ nickname, _id: { $ne: user._id } })) {
    throw new HttpError(409, '이미 사용 중인 닉네임입니다.')
  }
  try {
    await users.updateOne({ _id: user._id }, { $set: { nickname } })
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      throw new HttpError(409, '이미 사용 중인 닉네임입니다.')
    }
    throw error
  }
  return json({ nickname })
})
