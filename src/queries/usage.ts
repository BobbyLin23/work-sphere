import { auth } from "@clerk/tanstack-react-start/server"
import { createServerFn } from "@tanstack/react-start"
import { count, eq } from "drizzle-orm"
import { db } from "@/db"
import { bots } from "@/db/schema"
import { PAID_PLAN } from "@/lib/billing"
import { refreshUsagePeriod } from "@/lib/billing.server"
import { MAX_BOTS, USAGE_LIMITS } from "@/lib/usage"
import { getUsagePeriod, getUsageTotals } from "@/lib/usage.server"

export const getUsage = createServerFn({ method: "GET" }).handler(async () => {
  const { isAuthenticated, userId, has } = await auth()
  if (!isAuthenticated) {
    throw new Error("Unauthorized")
  }

  const subscribed = has({ plan: PAID_PLAN })
  if (subscribed) {
    await refreshUsagePeriod(userId)
  }
  const period = await getUsagePeriod(userId)
  const totals = await getUsageTotals(userId, period)
  const [{ total: botCount }] = await db
    .select({ total: count() })
    .from(bots)
    .where(eq(bots.userId, userId))

  return {
    subscribed,
    periodStart: period.start.toISOString(),
    periodEnd: period.end.toISOString(),
    meters: {
      aiTokens: { used: totals.ai_tokens, limit: USAGE_LIMITS.ai_tokens },
      sandboxSeconds: {
        used: totals.sandbox_seconds,
        limit: USAGE_LIMITS.sandbox_seconds,
      },
      bots: { used: botCount, limit: MAX_BOTS },
    },
  }
})
