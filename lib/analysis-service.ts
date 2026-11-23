import type { CveAnalysis } from './analysis-result.ts'
import { GeminiApiError, type CveAnalysisInput } from './gemini.ts'

type Reservation = {
  allowed: boolean
  remaining: number
  dateKey: string
}

type AnalysisCache = {
  analysisSourceKey?: string
  analysis?: CveAnalysis
} | null

type AnalysisDependencies<UserId> = {
  isBlocked(): Promise<boolean>
  reserve(userId: UserId): Promise<Reservation>
  refund(userId: UserId, dateKey: string): Promise<void>
  getCache(cveId: string): Promise<AnalysisCache>
  saveAnalysis(cveId: string, sourceKey: string, analysis: CveAnalysis): Promise<void>
  blockDaily(): Promise<void>
  analyze(cve: CveAnalysisInput): Promise<CveAnalysis>
}

export class AnalysisServiceError extends Error {
  readonly code: 'GLOBAL_QUOTA' | 'USER_LIMIT' | 'TEMPORARY' | 'FAILED'

  constructor(code: AnalysisServiceError['code'], message: string) {
    super(message)
    this.name = 'AnalysisServiceError'
    this.code = code
  }
}

export async function runCveAnalysis<UserId>({
  userId,
  sourceKey,
  cve,
  dependencies,
}: {
  userId: UserId
  sourceKey: string
  cve: CveAnalysisInput
  dependencies: AnalysisDependencies<UserId>
}) {
  if (await dependencies.isBlocked()) {
    throw new AnalysisServiceError(
      'GLOBAL_QUOTA',
      '오늘 전체 AI 사용량이 소진되었습니다. 다음 초기화 후 다시 시도해주세요.',
    )
  }

  const reservation = await dependencies.reserve(userId)
  if (!reservation.allowed) {
    throw new AnalysisServiceError('USER_LIMIT', '오늘 사용할 수 있는 AI 추가 분석 5회를 모두 사용했습니다.')
  }

  try {
    const cached = await dependencies.getCache(cve.id)
    if (cached?.analysisSourceKey === sourceKey && cached.analysis) {
      return { analysis: cached.analysis, remaining: reservation.remaining, cached: true }
    }

    const analysis = await dependencies.analyze(cve)
    await dependencies.saveAnalysis(cve.id, sourceKey, analysis)
    return { analysis, remaining: reservation.remaining, cached: false }
  } catch (error) {
    await dependencies.refund(userId, reservation.dateKey)
    if (error instanceof GeminiApiError && error.rateLimitKind === 'daily') {
      await dependencies.blockDaily()
      throw new AnalysisServiceError(
        'GLOBAL_QUOTA',
        '오늘 전체 AI 사용량이 소진되었습니다. 다음 초기화 후 다시 시도해주세요.',
      )
    }
    if (error instanceof GeminiApiError && error.rateLimitKind === 'temporary') {
      throw new AnalysisServiceError(
        'TEMPORARY',
        '현재 AI 요청이 많습니다. 잠시 후 다시 시도해주세요.',
      )
    }
    throw new AnalysisServiceError('FAILED', 'AI 추가 분석에 실패했습니다. 잠시 후 다시 시도해주세요.')
  }
}

