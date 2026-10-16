import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { HttpError } from '@/lib/validators'

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

// 다른 사이트에서 보낸 요청(CSRF)을 막기 위해 Origin 헤더가 우리 주소와 같은지 확인한다.
function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  let originHost: string | null = null
  try {
    originHost = new URL(origin).host
  } catch {
    // origin이 "null"처럼 주소가 아니면 아래에서 거절된다.
  }
  if (!originHost || originHost !== host) {
    throw new HttpError(403, '허용되지 않은 요청입니다.')
  }
}

// JSON 본문만 받는다. 일반 HTML form은 application/json을 보낼 수 없어 CSRF 방어에도 도움이 된다.
export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    throw new HttpError(415, 'JSON 형식으로 요청해주세요.')
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new HttpError(400, '요청 형식이 올바르지 않습니다.')
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, '요청 형식이 올바르지 않습니다.')
  }
  return body as Record<string, unknown>
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new HttpError(401, '로그인이 필요합니다.')
  return user
}

// 모든 API 핸들러를 감싸서 공통 처리(출처 확인, 에러 응답)를 한다.
// 예상하지 못한 에러는 내용을 숨기고 서버 로그에만 남긴다.
export function route<Context>(handler: (request: Request, context: Context) => Promise<Response>) {
  return async (request: Request, context: Context) => {
    try {
      if (request.method !== 'GET') assertSameOrigin(request)
      return await handler(request, context)
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message }, error.status)
      console.error(error)
      return json({ error: '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, 500)
    }
  }
}
