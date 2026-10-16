// 페이지(서버 컴포넌트)에서 화면에 보여줄 데이터를 읽어오는 함수 모음.
// 쓰기(등록·수정·삭제)는 app/api/ 아래의 API 라우트에서 처리한다.
import { ObjectId, type Filter, type Sort, type WithId } from 'mongodb'
import { collections, type QuestionDoc, type ReportDoc } from '@/lib/mongodb'
import { escapeRegex, isObjectIdString } from '@/lib/validators'

const DELETED_USER = '(알 수 없음)'

function excerpt(text: string, length = 140) {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > length ? `${flat.slice(0, length)}…` : flat
}

// 작성자 id 목록 → 닉네임. 닉네임을 바꾸면 예전 글에도 바로 반영되도록 매번 조회한다.
async function nicknameMap(ids: ObjectId[]) {
  const unique = [...new Map(ids.map((id) => [id.toHexString(), id])).values()]
  if (unique.length === 0) return new Map<string, string>()
  const { users } = await collections()
  const docs = await users
    .find({ _id: { $in: unique } }, { projection: { nickname: 1 } })
    .toArray()
  return new Map(docs.map((u) => [u._id.toHexString(), u.nickname]))
}

// ── 질의응답 ────────────────────────────────────────────────────
export type QnaFilter = 'latest' | 'popular' | 'unsolved' | 'solved'

export type QuestionSummary = {
  id: string
  title: string
  excerpt: string
  author: string
  createdAt: Date
  views: number
  answerCount: number
  solved: boolean
}

export async function listQuestions({
  search,
  filter = 'latest',
  authorId,
  limit = 50,
}: {
  search?: string
  filter?: QnaFilter
  authorId?: ObjectId
  limit?: number
} = {}): Promise<QuestionSummary[]> {
  const { questions } = await collections()
  const query: Filter<QuestionDoc> = {}
  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: 'i' }
    query.$or = [{ title: pattern }, { body: pattern }]
  }
  if (filter === 'unsolved') query.acceptedAnswerId = null
  if (filter === 'solved') query.acceptedAnswerId = { $ne: null }
  if (authorId) query.authorId = authorId

  const sort: Sort = filter === 'popular' ? { views: -1, createdAt: -1 } : { createdAt: -1 }
  const docs = await questions.find(query).sort(sort).limit(limit).toArray()
  const names = await nicknameMap(docs.map((d) => d.authorId))

  return docs.map((d) => ({
    id: d._id.toHexString(),
    title: d.title,
    excerpt: excerpt(d.body),
    author: names.get(d.authorId.toHexString()) ?? DELETED_USER,
    createdAt: d.createdAt,
    views: d.views,
    answerCount: d.answerCount,
    solved: d.acceptedAnswerId !== null,
  }))
}

export type AnswerView = {
  id: string
  body: string
  author: string
  authorId: string
  createdAt: Date
  accepted: boolean
}

export async function getQuestionWithAnswers(id: string) {
  if (!isObjectIdString(id)) return null
  const { questions, answers } = await collections()
  const _id = new ObjectId(id)

  // 상세 페이지를 열 때마다 조회수를 1 올리고, 올라간 값을 받아온다.
  const question = await questions.findOneAndUpdate(
    { _id },
    { $inc: { views: 1 } },
    { returnDocument: 'after' },
  )
  if (!question) return null

  const answerDocs = await answers.find({ questionId: _id }).sort({ createdAt: 1 }).toArray()
  const names = await nicknameMap([question.authorId, ...answerDocs.map((a) => a.authorId)])
  const acceptedId = question.acceptedAnswerId?.toHexString() ?? null

  const answerViews: AnswerView[] = answerDocs
    .map((a) => ({
      id: a._id.toHexString(),
      body: a.body,
      author: names.get(a.authorId.toHexString()) ?? DELETED_USER,
      authorId: a.authorId.toHexString(),
      createdAt: a.createdAt,
      accepted: a._id.toHexString() === acceptedId,
    }))
    // 채택된 답변을 맨 위로
    .sort((a, b) => Number(b.accepted) - Number(a.accepted))

  return {
    question: {
      id: question._id.toHexString(),
      title: question.title,
      body: question.body,
      author: names.get(question.authorId.toHexString()) ?? DELETED_USER,
      authorId: question.authorId.toHexString(),
      createdAt: question.createdAt,
      views: question.views,
      solved: acceptedId !== null,
    },
    answers: answerViews,
  }
}

// ── 원데이 리포트 ───────────────────────────────────────────────
export type ReportSummary = {
  id: string
  title: string
  cveId: string | null
  excerpt: string
  author: string
  createdAt: Date
  updatedAt: Date
}

function toReportSummary(d: WithId<ReportDoc>, names: Map<string, string>): ReportSummary {
  return {
    id: d._id.toHexString(),
    title: d.title,
    cveId: d.cveId,
    excerpt: excerpt(d.content),
    author: names.get(d.authorId.toHexString()) ?? DELETED_USER,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }
}

export async function listReports({
  search,
  authorId,
  limit = 50,
}: { search?: string; authorId?: ObjectId; limit?: number } = {}): Promise<ReportSummary[]> {
  const { reports } = await collections()
  const query: Filter<ReportDoc> = {}
  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: 'i' }
    query.$or = [{ title: pattern }, { cveId: pattern }, { content: pattern }]
  }
  if (authorId) query.authorId = authorId

  const docs = await reports.find(query).sort({ createdAt: -1 }).limit(limit).toArray()
  const names = await nicknameMap(docs.map((d) => d.authorId))
  return docs.map((d) => toReportSummary(d, names))
}

export async function getReport(id: string) {
  if (!isObjectIdString(id)) return null
  const { reports } = await collections()
  const doc = await reports.findOne({ _id: new ObjectId(id) })
  if (!doc) return null
  const names = await nicknameMap([doc.authorId])
  return {
    ...toReportSummary(doc, names),
    content: doc.content,
    authorId: doc.authorId.toHexString(),
  }
}

// ── 즐겨찾기 ────────────────────────────────────────────────────
export async function listFavorites(userId: ObjectId) {
  const { favorites } = await collections()
  const docs = await favorites.find({ userId }).sort({ createdAt: -1 }).toArray()
  return docs.map((d) => ({ cveId: d.cveId, createdAt: d.createdAt }))
}
