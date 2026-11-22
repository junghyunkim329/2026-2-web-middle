import { createHash } from 'node:crypto'
import {
  blockGeminiForCurrentProviderDay,
  getCveAiCache,
  isGeminiBlocked,
  refundAnalysisUse,
  reserveAnalysisUse,
  saveCveAiCache,
} from '@/lib/ai-store'
import { AnalysisValidationError, validateAnalysisRequest } from '@/lib/analysis-result'
import { AnalysisServiceError, runCveAnalysis } from '@/lib/analysis-service'
import { json, readJsonBody, requireUser, route } from '@/lib/api'
import { analyzeCve } from '@/lib/gemini'
import { collections } from '@/lib/mongodb'
import { HttpError } from '@/lib/validators'

export const POST = route(async (request) => {
  const user = await requireUser()
  const body = await readJsonBody(request)
  let cveId: string
  try {
    cveId = validateAnalysisRequest(body).cveId
  } catch (error) {
    if (error instanceof AnalysisValidationError) throw new HttpError(400, error.message)
    throw error
  }

  const { nvdCveCache } = await collections()
  const cachedCve = await nvdCveCache.findOne({ cveId })
  if (!cachedCve) {
    throw new HttpError(404, '먼저 해당 CVE를 검색해주세요.')
  }

  const cve = cachedCve.result
  const analysisInput = {
    id: cve.id,
    description: cve.description,
    cvss: cve.cvss
      ? { score: cve.cvss.score, severity: cve.cvss.severity, vector: cve.cvss.vector }
      : null,
    weaknesses: cve.weaknesses,
  }
  const sourceKey = createHash('sha256').update(JSON.stringify(analysisInput)).digest('hex')

  try {
    const result = await runCveAnalysis({
      userId: user._id,
      sourceKey,
      cve: analysisInput,
      dependencies: {
        isBlocked: isGeminiBlocked,
        reserve: reserveAnalysisUse,
        refund: refundAnalysisUse,
        getCache: getCveAiCache,
        saveAnalysis: (id, key, analysis) =>
          saveCveAiCache(id, { analysisSourceKey: key, analysis }),
        blockDaily: blockGeminiForCurrentProviderDay,
        analyze: analyzeCve,
      },
    })
    return json(result)
  } catch (error) {
    if (!(error instanceof AnalysisServiceError)) throw error
    const status =
      error.code === 'USER_LIMIT'
        ? 429
        : error.code === 'FAILED'
          ? 502
          : 503
    throw new HttpError(status, error.message)
  }
})

