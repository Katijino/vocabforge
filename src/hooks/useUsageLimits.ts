import { useUserSettings } from './useUserSettings'

const FREE_STORY_LIMIT = 5

export function useUsageLimits(userId: string) {
  const { data: settings } = useUserSettings(userId)

  const isPro = settings?.subscription_tier === 'pro'
  const wordsCount = settings?.words_count ?? 0
  const storiesUsed = settings?.stories_used_month ?? 0

  const canGenerateStory = isPro || storiesUsed < FREE_STORY_LIMIT

  const storiesRemaining = isPro ? null : Math.max(0, FREE_STORY_LIMIT - storiesUsed)

  return {
    isPro,
    canGenerateStory,
    storiesRemaining,
    wordsCount,
    storiesUsed,
    FREE_STORY_LIMIT,
  }
}
