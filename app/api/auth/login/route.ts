import { json, readJsonBody, route } from '@/lib/api'
import { createSession, getDummyHash, verifyPassword } from '@/lib/auth'
import { collections } from '@/lib/mongodb'
import { HttpError, LIMITS } from '@/lib/validators'

const MAX_FAILURES = 5
const LOCK_WINDOW_MS = 15 * 60 * 1000

export const POST = route(async (request) => {
  const body = await readJsonBody(request)
  // 문자열이 아니면(예: {"$ne": null}) 빈 값으로 취급 → NoSQL 인젝션 방지
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const remember = body.remember === true
  if (!email || !password) throw new HttpError(400, '이메일과 비밀번호를 입력해주세요.')
  if (email.length > LIMITS.emailMax || password.length > LIMITS.passwordMax) {
    throw new HttpError(401, '이메일 또는 비밀번호가 올바르지 않습니다.')
  }

  const { users, loginAttempts } = await collections()

  // 무차별 대입 공격 방지: 15분 안에 5번 틀리면 잠시 잠근다.
  const recentFailures = await loginAttempts.countDocuments({
    email,
    createdAt: { $gt: new Date(Date.now() - LOCK_WINDOW_MS) },
  })
  if (recentFailures >= MAX_FAILURES) {
    throw new HttpError(429, '로그인 시도가 너무 많습니다. 15분 후에 다시 시도해주세요.')
  }

  const user = await users.findOne({ email })
  const valid = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()))

  if (!user || !valid) {
    await loginAttempts.insertOne({ email, createdAt: new Date() })
    // 이메일이 없는지, 비밀번호가 틀렸는지 구분하지 않는다. (가입 여부 노출 방지)
    throw new HttpError(401, '이메일 또는 비밀번호가 올바르지 않습니다.')
  }

  await loginAttempts.deleteMany({ email })
  await createSession(user._id, remember)
  return json({ ok: true })
})
