import { useEffect } from 'react'
import { SWRConfig } from 'swr'
import posthog from 'posthog-js'
import { persistMiddleware } from '@/lib/offline/persist'
import { claimOfflineData } from '@/lib/offline/session'

// Responses are saved for offline use (lib/offline/persist.ts).
export default function SWRProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={{ use: [persistMiddleware] }}>{children}</SWRConfig>
}

/** Per-user side effects of being signed in: analytics identity and offline ownership. */
export function useSessionEffects(userId: string | undefined) {
  // Identify the PostHog user (every family member individually).
  useEffect(() => {
    if (userId && posthog.get_distinct_id() !== userId) posthog.identify(userId)
  }, [userId])

  useEffect(() => {
    if (userId) void claimOfflineData(userId)
  }, [userId])
}
