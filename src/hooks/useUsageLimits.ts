import { useUserSettings } from './useUserSettings'

const FREE_WORD_LIMIT = 50
const FREE_STORY_LIMIT = 5

export function useUsageLimits(userId: string) {
  const { data: settings } = useUserSettings(userId)

  const isPro = settings?.subscription_tier === 'pro'
  const wordsCount = settings?.words_count ?? 0
  const storiesUsed = settings?.stories_used_month ?? 0

  const canAddWord = true
  const canGenerateStory = isPro || storiesUsed < FREE_STORY_LIMIT

  const wordsRemaining = isPro ? null : Math.max(0, FREE_WORD_LIMIT - wordsCount)
  const storiesRemaining = isPro ? null : Math.max(0, FREE_STORY_LIMIT - storiesUsed)

  return {
    isPro,
    canAddWord,
    canGenerateStory,
    wordsRemaining,
    storiesRemaining,
    wordsCount,
    storiesUsed,
    FREE_WORD_LIMIT,
    FREE_STORY_LIMIT,
  }
}
