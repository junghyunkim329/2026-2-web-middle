import { MongoClient, type Db, type ObjectId } from 'mongodb'

// ── 컬렉션 문서 타입 ────────────────────────────────────────────
// _id는 MongoDB가 자동으로 붙이므로 적지 않는다. (조회 결과는 WithId<…> 타입)
export type UserDoc = {
  email: string
  nickname: string
  passwordHash: string
  createdAt: Date
}

export type SessionDoc = {
  tokenHash: string // 쿠키 토큰 원문이 아닌 SHA-256 해시만 저장
  userId: ObjectId
  createdAt: Date
  expiresAt: Date
}

export type LoginAttemptDoc = {
  email: string
  createdAt: Date
}

export type FavoriteDoc = {
  userId: ObjectId
  cveId: string
  createdAt: Date
}

export type QuestionDoc = {
  title: string
  body: string
  authorId: ObjectId
  views: number
  answerCount: number
  acceptedAnswerId: ObjectId | null
  createdAt: Date
}

export type AnswerDoc = {
  questionId: ObjectId
  authorId: ObjectId
  body: string
  createdAt: Date
}

export type ReportDoc = {
  title: string
  cveId: string | null
  content: string
  authorId: ObjectId
  createdAt: Date
  updatedAt: Date
}

export type NvdCveResult = {
  id: string
  description: string
  published: string
  lastModified: string
  status: string | null
  cvss: {
    score: number | null
    severity: string | null
    version: string | null
    vector: string | null
  } | null
  weaknesses: string[]
  references: { url: string; source?: string }[]
}

export type NvdCveCacheDoc = {
  cveId: string
  result: NvdCveResult
  fetchedAt: Date
  expiresAt: Date
}

// ── 연결 ────────────────────────────────────────────────────────
// 개발 서버는 코드가 바뀔 때마다 모듈을 다시 불러오므로
// 연결을 globalThis에 보관해 연결이 계속 늘어나는 것을 막는다.
const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>
  _mongoIndexesPromise?: Promise<void>
}

function getClient() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI 환경 변수가 없습니다. 프로젝트 루트의 .env.local 파일을 확인하세요.')
  }
  if (!globalForMongo._mongoClientPromise) {
    globalForMongo._mongoClientPromise = new MongoClient(uri).connect().catch((error) => {
      globalForMongo._mongoClientPromise = undefined
      throw error
    })
  }
  return globalForMongo._mongoClientPromise
}

// 서버가 뜬 뒤 처음 DB를 쓸 때 한 번만 인덱스를 만든다. (이미 있으면 그대로 둔다)
async function ensureIndexes(db: Db) {
  // 만료된 세션·로그인 기록을 MongoDB가 자동으로 지우게 하는 TTL 인덱스.
  // 조회할 때 항상 만료 시간을 확인하므로, 지원하지 않는 DB에서 실패해도 동작에는 문제가 없다.
  await Promise.all([
    db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('loginAttempts').createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 }),
    db.collection('nvdCveCache').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]).catch((error) => console.warn('TTL 인덱스를 만들지 못했습니다:', error.message))

  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('users').createIndex({ nickname: 1 }, { unique: true }),
    db.collection('sessions').createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection('loginAttempts').createIndex({ email: 1, createdAt: 1 }),
    db.collection('favorites').createIndex({ userId: 1, cveId: 1 }, { unique: true }),
    db.collection('questions').createIndex({ createdAt: -1 }),
    db.collection('questions').createIndex({ authorId: 1 }),
    db.collection('answers').createIndex({ questionId: 1, createdAt: 1 }),
    db.collection('reports').createIndex({ createdAt: -1 }),
    db.collection('reports').createIndex({ authorId: 1 }),
    db.collection('nvdCveCache').createIndex({ cveId: 1 }, { unique: true }),
  ])
}

export async function getDb(): Promise<Db> {
  const client = await getClient()
  // MONGODB_DB가 없으면 접속 주소에 적힌 DB 이름(…mongodb.net/cvehub?…)을 사용한다.
  const db = client.db(process.env.MONGODB_DB || undefined)
  if (!globalForMongo._mongoIndexesPromise) {
    globalForMongo._mongoIndexesPromise = ensureIndexes(db).catch((error) => {
      globalForMongo._mongoIndexesPromise = undefined
      throw error
    })
  }
  await globalForMongo._mongoIndexesPromise
  return db
}

export async function collections() {
  const db = await getDb()
  return {
    users: db.collection<UserDoc>('users'),
    sessions: db.collection<SessionDoc>('sessions'),
    loginAttempts: db.collection<LoginAttemptDoc>('loginAttempts'),
    favorites: db.collection<FavoriteDoc>('favorites'),
    questions: db.collection<QuestionDoc>('questions'),
    answers: db.collection<AnswerDoc>('answers'),
    reports: db.collection<ReportDoc>('reports'),
    nvdCveCache: db.collection<NvdCveCacheDoc>('nvdCveCache'),
  }
}
