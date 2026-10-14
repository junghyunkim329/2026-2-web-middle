import { cache } from 'react'
import { cookies } from 'next/headers'
import { createHash, randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto'
import type { ObjectId } from 'mongodb'
import { collections } from '@/lib/mongodb'

export const SESSION_COOKIE = 'cvehub_session'

const REMEMBER_SESSION_MS = 30 * 24 * 60 * 60 * 1000 // 로그인 유지: 30일
const DEFAULT_SESSION_MS = 12 * 60 * 60 * 1000 // 기본: 12시간

// ── 비밀번호 해시 (Node 내장 scrypt) ────────────────────────────
// 저장 형식: scrypt$N$r$p$salt(base64)$hash(base64)
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 }
const KEY_LENGTH = 64

function scryptAsync(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, { ...options, maxmem: 64 * 1024 * 1024 }, (error, key) =>
      error ? reject(error) : resolve(key),
    )
  })
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await scryptAsync(password, salt, SCRYPT_PARAMS)
  const { N, r, p } = SCRYPT_PARAMS
  return ['scrypt', N, r, p, salt.toString('base64'), hash.toString('base64')].join('$')
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, N, r, p, salt, hash] = stored.split('$')
  if (algorithm !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'base64')
  const actual = await scryptAsync(password, Buffer.from(salt, 'base64'), {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  })
  // 비교 시간이 일정한 함수로 비교해 타이밍 공격을 막는다.
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

// 없는 이메일로 로그인할 때도 해시 계산을 한 번 해서 응답 시간으로
// 가입 여부를 추측할 수 없게 한다.
let dummyHashPromise: Promise<string> | undefined
export function getDummyHash() {
  dummyHashPromise ??= hashPassword(randomBytes(16).toString('hex'))
  return dummyHashPromise
}

// ── 세션 ────────────────────────────────────────────────────────
function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function createSession(userId: ObjectId, remember: boolean) {
  const { sessions } = await collections()
  const cookieStore = await cookies()

  // 이전 세션이 남아 있으면 지운다. (세션 고정 공격 방지)
  const previous = cookieStore.get(SESSION_COOKIE)?.value
  if (previous) await sessions.deleteOne({ tokenHash: hashToken(previous) })

  const token = randomBytes(32).toString('base64url')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + (remember ? REMEMBER_SESSION_MS : DEFAULT_SESSION_MS))
  await sessions.insertOne({ tokenHash: hashToken(token), userId, createdAt: now, expiresAt })

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true, // 자바스크립트(document.cookie)로 읽을 수 없음 → XSS로 세션 탈취 방지
    secure: process.env.NODE_ENV === 'production', // 배포 환경에서는 HTTPS로만 전송
    sameSite: 'lax', // 다른 사이트에서 보낸 POST 요청에는 쿠키가 실리지 않음 → CSRF 완화
    path: '/',
    // 로그인 유지를 선택하지 않으면 브라우저를 닫을 때 쿠키가 사라진다.
    ...(remember ? { expires: expiresAt } : {}),
  })
}

export async function destroySession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    const { sessions } = await collections()
    await sessions.deleteOne({ tokenHash: hashToken(token) })
  }
  cookieStore.delete(SESSION_COOKIE)
}

export type CurrentUser = {
  _id: ObjectId
  id: string
  email: string
  nickname: string
  createdAt: Date
}

// 한 요청 안에서 여러 번 불러도 DB 조회는 한 번만 하도록 cache로 감싼다.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null

  const { sessions, users } = await collections()
  const session = await sessions.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  })
  if (!session) return null

  const user = await users.findOne({ _id: session.userId })
  if (!user) return null

  return {
    _id: user._id,
    id: user._id.toHexString(),
    email: user.email,
    nickname: user.nickname,
    createdAt: user.createdAt,
  }
})
