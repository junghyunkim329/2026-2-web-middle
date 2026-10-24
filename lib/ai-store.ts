import { MongoServerError, type ObjectId } from 'mongodb'
import { createAiStore, type AiStoreBackend } from '@/lib/ai-store-core'
import { collections, type CveAiCacheDoc } from '@/lib/mongodb'

const backend: AiStoreBackend<ObjectId> = {
  async incrementUsageIfBelow(userId, dateKey, limit) {
    const { aiUsage } = await collections()
    const now = new Date()
    try {
      const result = await aiUsage.findOneAndUpdate(
        { userId, dateKey, count: { $lt: limit } },
        {
          $inc: { count: 1 },
          $set: { updatedAt: now },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true, returnDocument: 'after' },
      )
      return result?.count ?? null
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        const result = await aiUsage.findOneAndUpdate(
          { userId, dateKey, count: { $lt: limit } },
          { $inc: { count: 1 }, $set: { updatedAt: new Date() } },
          { returnDocument: 'after' },
        )
        return result?.count ?? null
      }
      throw error
    }
  },

  async decrementUsage(userId, dateKey) {
    const { aiUsage } = await collections()
    await aiUsage.updateOne(
      { userId, dateKey, count: { $gt: 0 } },
      { $inc: { count: -1 }, $set: { updatedAt: new Date() } },
    )
  },

  async getBlockedProviderDate() {
    const { geminiState } = await collections()
    const state = await geminiState.findOne({ _id: 'gemini-daily-quota' })
    return state?.providerDateKey ?? null
  },

  async setBlockedProviderDate(providerDateKey) {
    const { geminiState } = await collections()
    await geminiState.updateOne(
      { _id: 'gemini-daily-quota' },
      { $set: { providerDateKey, blockedAt: new Date() } },
      { upsert: true },
    )
  },
}

const store = createAiStore({ backend })

export const reserveAnalysisUse = store.reserveAnalysisUse
export const refundAnalysisUse = store.refundAnalysisUse
export const isGeminiBlocked = store.isGeminiBlocked
export const blockGeminiForCurrentProviderDay = store.blockGeminiForCurrentProviderDay

export async function getCveAiCache(cveId: string) {
  const { cveAiCache } = await collections()
  return cveAiCache.findOne({ cveId })
}

export async function saveCveAiCache(
  cveId: string,
  patch: Partial<Pick<CveAiCacheDoc, 'translationSource' | 'translationKo' | 'analysisSourceKey' | 'analysis'>>,
) {
  const { cveAiCache } = await collections()
  await cveAiCache.updateOne(
    { cveId },
    { $set: { ...patch, updatedAt: new Date() } },
    { upsert: true },
  )
}

