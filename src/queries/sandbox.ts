import { auth } from "@clerk/tanstack-react-start/server"
import { createServerFn } from "@tanstack/react-start"
import { and, asc, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { chats } from "@/db/schema"
import { assertPaidPlan } from "@/lib/billing.server"
import { getVncUrl } from "@/lib/daytona.server"
import { VNC_SESSION_SECONDS } from "@/lib/usage"
import { assertWithinLimit, recordUsage } from "@/lib/usage.server"

export const getSandboxVncUrl = createServerFn({ method: "POST" })
  .validator(z.object({ chatId: z.string() }))
  .handler(async ({ data }) => {
    const { isAuthenticated, userId } = await auth()
    if (!isAuthenticated) {
      throw new Error("Unauthorized")
    }

    await assertPaidPlan()
    await assertWithinLimit(userId, "sandbox_seconds")

    const chat = await db.query.chats.findFirst({
      where: and(eq(chats.id, data.chatId), eq(chats.userId, userId)),
      with: {
        members: {
          orderBy: (members) => asc(members.joinedAt),
          limit: 1,
          with: { bot: true },
        },
      },
    })

    if (chat?.kind === "group") {
      throw new Error("Group chats have no desktop")
    }

    const sandboxId = chat?.members[0]?.bot.sandboxId
    if (!sandboxId) {
      throw new Error("This bot has no sandbox")
    }

    const url = await getVncUrl(sandboxId)
    await recordUsage({
      userId,
      kind: "sandbox_seconds",
      amount: VNC_SESSION_SECONDS,
      botId: chat?.members[0]?.bot.id,
    })
    return url
  })
