export const PAID_PLAN = "pro"
export const SUBSCRIPTION_REQUIRED = "Subscription required"

export function isSubscriptionRequired(error: unknown) {
  return error instanceof Error && error.message === SUBSCRIPTION_REQUIRED
}
