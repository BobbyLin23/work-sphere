export const USAGE_KINDS = ["ai_tokens", "sandbox_seconds"] as const
export type UsageKind = (typeof USAGE_KINDS)[number]

// Allowance per subscription period on the paid plan.
export const USAGE_LIMITS = {
  ai_tokens: 2_000_000,
  sandbox_seconds: 10 * 60 * 60,
} satisfies Record<UsageKind, number>

export const MAX_BOTS = 3

// Opening the desktop keeps the sandbox running without any tool call, so each
// grant is charged a flat block instead of measured time.
export const VNC_SESSION_SECONDS = 5 * 60

export const USAGE_LIMIT_REACHED = "Usage limit reached"

export function isUsageLimitReached(error: unknown) {
  return error instanceof Error && error.message === USAGE_LIMIT_REACHED
}
