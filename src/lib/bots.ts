import { auth } from "@clerk/tanstack-react-start/server"
import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { bots, chatMembers, chats, createBotSchema } from "@/db/schema"

export const createBot = createServerFn({ method: "POST" })
  .validator(createBotSchema)
  .handler(async ({ data }) => {
    const { isAuthenticated, userId } = await auth()
    if (!isAuthenticated) {
      throw new Error("Unauthorized")
    }

    return db.transaction(async (tx) => {
      const [bot] = await tx
        .insert(bots)
        .values({ ...data, instructions: data.instructions || null, userId })
        .returning()
      const [chat] = await tx
        .insert(chats)
        .values({ userId, kind: "direct" })
        .returning()
      await tx.insert(chatMembers).values({ chatId: chat.id, botId: bot.id })
      return bot
    })
  })
