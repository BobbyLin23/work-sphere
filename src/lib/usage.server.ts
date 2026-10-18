import { addMonths } from "date-fns"
import { and, eq, gte, lt, sql } from "drizzle-orm"
import { db } from "../db"
import { usageEvents, usagePeriods } from "../db/schema"
import {
  USAGE_KINDS,
  USAGE_LIMIT_REACHED,
  USAGE_LIMITS,
  type UsageKind,
} from "./usage"

export type UsagePeriod = { start: Date; end: Date }

function calendarMonth(now: Date): UsagePeriod {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  return { start, end: addMonths(start, 1) }
}

export async function setUsagePeriod(userId: string, period: UsagePeriod) {
  await db
    .insert(usagePeriods)
    .values({
      userId,
      periodStart: period.start,
      periodEnd: period.end,
    })
    .onConflictDoUpdate({
      target: usagePeriods.userId,
      set: { periodStart: period.start, periodEnd: period.end },
    })
}

// Falls back to the calendar month for users without a cached subscription
// period. A stale cached period is rolled forward monthly until the next
// refresh from Clerk.
export async function getUsagePeriod(
  userId: string,
  now = new Date()
): Promise<UsagePeriod> {
  const row = await db.query.usagePeriods.findFirst({
    where: eq(usagePeriods.userId, userId),
  })
  if (!row) {
    return calendarMonth(now)
  }
  let { periodStart: start, periodEnd: end } = row
  while (end <= now) {
    start = end
    end = addMonths(end, 1)
  }
  return { start, end }
}

export async function getUsageTotals(userId: string, period: UsagePeriod) {
  const rows = await db
    .select({
      kind: usageEvents.kind,
      total: sql<string>`coalesce(sum(${usageEvents.amount}), 0)`,
    })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.userId, userId),
        gte(usageEvents.createdAt, period.start),
        lt(usageEvents.createdAt, period.end)
      )
    )
    .groupBy(usageEvents.kind)

  const totals = Object.fromEntries(
    USAGE_KINDS.map((kind) => [kind, 0])
  ) as Record<UsageKind, number>
  for (const row of rows) {
    totals[row.kind] = Number(row.total)
  }
  return totals
}

export async function getRemaining(userId: string, kind: UsageKind) {
  const period = await getUsagePeriod(userId)
  const totals = await getUsageTotals(userId, period)
  return Math.max(0, USAGE_LIMITS[kind] - totals[kind])
}

export async function assertWithinLimit(userId: string, kind: UsageKind) {
  if ((await getRemaining(userId, kind)) <= 0) {
    throw new Error(USAGE_LIMIT_REACHED)
  }
}

export async function recordUsage(entry: {
  userId: string
  kind: UsageKind
  amount: number
  botId?: string | null
}) {
  const amount = Math.ceil(entry.amount)
  if (amount <= 0) {
    return
  }
  await db.insert(usageEvents).values({ ...entry, amount })
}
