import { json, requireUser, route } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { collections } from '@/lib/mongodb'
import { validateCveId } from '@/lib/validators'

type Context = { params: Promise<{ cveId: string }> }

// 즐겨찾기 여부 확인 (로그인하지 않았으면 loggedIn: false)
export const GET = route(async (_request, { params }: Context) => {
  const cveId = validateCveId((await params).cveId)
  const user = await getCurrentUser()
  if (!user) return json({ loggedIn: false, favorited: false })

  const { favorites } = await collections()
  const found = await favorites.findOne({ userId: user._id, cveId })
  return json({ loggedIn: true, favorited: Boolean(found) })
})

// 즐겨찾기 추가 (이미 있으면 그대로)
export const PUT = route(async (_request, { params }: Context) => {
  const user = await requireUser()
  const cveId = validateCveId((await params).cveId)
  const { favorites } = await collections()
  await favorites.updateOne(
    { userId: user._id, cveId },
    { $setOnInsert: { userId: user._id, cveId, createdAt: new Date() } },
    { upsert: true },
  )
  return json({ favorited: true })
})

// 즐겨찾기 해제
export const DELETE = route(async (_request, { params }: Context) => {
  const user = await requireUser()
  const cveId = validateCveId((await params).cveId)
  const { favorites } = await collections()
  await favorites.deleteOne({ userId: user._id, cveId })
  return json({ favorited: false })
})
