import { auth, clerkClient } from "@clerk/tanstack-react-start/server"
import { addMonths } from "date-fns"
import { PAID_PLAN, SUBSCRIPTION_REQUIRED } from "@/lib/billing"
import { setUsagePeriod } from "@/lib/usage.server"

// Mirrors the subscription period into the database so usage is counted per
// billing period, including from Trigger.dev tasks that cannot call Clerk.
export async function refreshUsagePeriod(userId: string) {
  try {
    const subscription =
      await clerkClient().billing.getUserBillingSubscription(userId)
    const item = subscription.subscriptionItems.find(
      (candidate) =>
        candidate.plan?.slug === PAID_PLAN &&
        (candidate.status === "active" || candidate.status === "past_due")
    )
    if (item) {
      const start = new Date(item.periodStart)
      await setUsagePeriod(userId, {
        start,
        end: item.periodEnd ? new Date(item.periodEnd) : addMonths(start, 1),
      })
    }
  } catch {
    // Keep the previously cached period when Clerk is unreachable.
  }
}

export async function assertPaidPlan() {
  const { isAuthenticated, userId, has } = await auth()
  if (!isAuthenticated) {
    throw new Error("Unauthorized")
  }
  if (!has({ plan: PAID_PLAN })) {
    throw new Error(SUBSCRIPTION_REQUIRED)
  }
  await refreshUsagePeriod(userId)
  return userId
}
