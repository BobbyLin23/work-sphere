import { auth } from "@clerk/tanstack-react-start/server"
import { createServerFn } from "@tanstack/react-start"
import { and, asc, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { chats } from "@/db/schema"
import { getVncUrl } from "@/lib/daytona.server"

export const getSandboxVncUrl = createServerFn({ method: "POST" })
  .validator(z.object({ chatId: z.string() }))
  .handler(async ({ data }) => {
    const { isAuthenticated, userId } = await auth()
    if (!isAuthenticated) {
      throw new Error("Unauthorized")
    }

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

    return getVncUrl(sandboxId)
  })
