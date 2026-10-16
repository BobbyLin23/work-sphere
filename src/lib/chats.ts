import { auth } from "@clerk/tanstack-react-start/server"
import { createServerFn } from "@tanstack/react-start"
import { and, eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import { bots, chatMembers, chats, createGroupChatSchema } from "@/db/schema"

export const createGroupChat = createServerFn({ method: "POST" })
  .validator(createGroupChatSchema)
  .handler(async ({ data }) => {
    const { isAuthenticated, userId } = await auth()
    if (!isAuthenticated) {
      throw new Error("Unauthorized")
    }

    const botIds = [...new Set(data.botIds)]
    const owned = await db
      .select({ id: bots.id })
      .from(bots)
      .where(and(inArray(bots.id, botIds), eq(bots.userId, userId)))
    if (owned.length !== botIds.length || botIds.length < 2) {
      throw new Error("Bot not found")
    }

    return db.transaction(async (tx) => {
      const [chat] = await tx
        .insert(chats)
        .values({ userId, kind: "group", name: data.name })
        .returning()
      await tx
        .insert(chatMembers)
        .values(botIds.map((botId) => ({ chatId: chat.id, botId })))
      return chat
    })
  })
