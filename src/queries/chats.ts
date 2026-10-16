import { auth } from "@clerk/tanstack-react-start/server"
import { notFound } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { and, asc, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { chats } from "@/db/schema"

export const getChat = createServerFn({ method: "GET" })
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
          with: { bot: true },
        },
      },
    })

    const members = chat?.members.map((member) => member.bot) ?? []
    const bot = members[0]
    if (!chat || !bot) {
      throw notFound()
    }

    return {
      id: chat.id,
      isGroup: chat.kind === "group",
      name: chat.name ?? bot.name,
      members: members.map((member) => ({
        id: member.id,
        name: member.name,
        avatar: member.avatar,
      })),
      bot: {
        id: bot.id,
        name: bot.name,
        job: bot.job,
        instructions: bot.instructions,
        avatar: bot.avatar,
      },
    }
  })
