import { dateKeyInZone } from './ai-policy.ts'

export const DAILY_ANALYSIS_LIMIT = 5

export type AnalysisReservation = {
  allowed: boolean
  remaining: number
  dateKey: string
}

export interface AiStoreBackend<UserId> {
  incrementUsageIfBelow(userId: UserId, dateKey: string, limit: number): Promise<number | null>
  decrementUsage(userId: UserId, dateKey: string): Promise<void>
  getBlockedProviderDate(): Promise<string | null>
  setBlockedProviderDate(dateKey: string): Promise<void>
}

export function createAiStore<UserId>({
  backend,
  now = () => new Date(),
}: {
  backend: AiStoreBackend<UserId>
  now?: () => Date
}) {
  return {
    async reserveAnalysisUse(userId: UserId): Promise<AnalysisReservation> {
      const dateKey = dateKeyInZone(now(), 'Asia/Seoul')
      const count = await backend.incrementUsageIfBelow(userId, dateKey, DAILY_ANALYSIS_LIMIT)
      if (count === null) return { allowed: false, remaining: 0, dateKey }
      return {
        allowed: true,
        remaining: Math.max(0, DAILY_ANALYSIS_LIMIT - count),
        dateKey,
      }
    },

    async refundAnalysisUse(userId: UserId, dateKey: string) {
      await backend.decrementUsage(userId, dateKey)
    },

    async isGeminiBlocked() {
      const providerDateKey = dateKeyInZone(now(), 'America/Los_Angeles')
      return (await backend.getBlockedProviderDate()) === providerDateKey
    },

    async blockGeminiForCurrentProviderDay() {
      const providerDateKey = dateKeyInZone(now(), 'America/Los_Angeles')
      await backend.setBlockedProviderDate(providerDateKey)
    },
  }
}

