import { json, route } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'

// 상단 메뉴에서 로그인 상태를 확인할 때 사용한다.
export const GET = route(async () => {
  const user = await getCurrentUser()
  return json({ user: user ? { nickname: user.nickname } : null })
})
