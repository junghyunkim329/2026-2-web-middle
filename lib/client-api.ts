// 브라우저(클라이언트 컴포넌트)에서 우리 API를 부를 때 쓰는 함수.
// 쿠키는 같은 사이트 요청이라 자동으로 실린다.

type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string }

export async function apiFetch<T = Record<string, unknown>>(
  url: string,
  { method = 'GET', body }: { method?: string; body?: unknown } = {},
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, status: res.status, error: data.error ?? '요청을 처리하지 못했습니다.' }
    }
    return { ok: true, data: data as T }
  } catch {
    return { ok: false, status: 0, error: '서버에 연결할 수 없습니다.' }
  }
}
