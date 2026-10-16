import { MongoServerError } from 'mongodb'
import { json, readJsonBody, route } from '@/lib/api'
import { createSession, hashPassword } from '@/lib/auth'
import { collections } from '@/lib/mongodb'
import { HttpError, validateEmail, validateNickname, validatePassword } from '@/lib/validators'

// 회원가입: 입력 검증 → 중복 확인 → 비밀번호 해시 저장 → 바로 로그인 처리
export const POST = route(async (request) => {
  const body = await readJsonBody(request)
  const nickname = validateNickname(body.nickname)
  const email = validateEmail(body.email)
  const password = validatePassword(body.password)
  if (body.agree !== true) throw new HttpError(400, '이용약관 및 개인정보 처리방침에 동의해주세요.')

  const { users } = await collections()
  if (await users.findOne({ email })) throw new HttpError(409, '이미 가입된 이메일입니다.')
  if (await users.findOne({ nickname })) throw new HttpError(409, '이미 사용 중인 닉네임입니다.')

  try {
    const { insertedId } = await users.insertOne({
      email,
      nickname,
      passwordHash: await hashPassword(password),
      createdAt: new Date(),
    })
    await createSession(insertedId, false)
  } catch (error) {
    // 동시에 같은 값으로 가입한 경우 unique 인덱스가 막아준다.
    if (error instanceof MongoServerError && error.code === 11000) {
      throw new HttpError(409, '이미 사용 중인 이메일 또는 닉네임입니다.')
    }
    throw error
  }

  return json({ ok: true }, 201)
})
