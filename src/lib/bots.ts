import { auth } from "@clerk/tanstack-react-start/server"
import { createServerFn } from "@tanstack/react-start"
import { and, eq, inArray } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import {
  bots,
  chatMembers,
  chats,
  createBotSchema,
  updateBotSchema,
} from "@/db/schema"

export const deleteBot = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { isAuthenticated, userId } = await auth()
    if (!isAuthenticated) {
      throw new Error("Unauthorized")
    }

    await db.transaction(async (tx) => {
      const memberships = await tx
        .select({ chatId: chatMembers.chatId })
        .from(chatMembers)
        .innerJoin(bots, eq(bots.id, chatMembers.botId))
        .where(and(eq(bots.id, data.id), eq(bots.userId, userId)))
      const deleted = await tx
        .delete(bots)
        .where(and(eq(bots.id, data.id), eq(bots.userId, userId)))
        .returning({ id: bots.id })
      if (deleted.length === 0) {
        throw new Error("Bot not found")
      }
      const chatIds = memberships.map((row) => row.chatId)
      if (chatIds.length > 0) {
        await tx
          .delete(chats)
          .where(and(inArray(chats.id, chatIds), eq(chats.userId, userId)))
      }
    })
  })

export const updateBot = createServerFn({ method: "POST" })
  .validator(updateBotSchema)
  .handler(async ({ data: { id, ...values } }) => {
    const { isAuthenticated, userId } = await auth()
    if (!isAuthenticated) {
      throw new Error("Unauthorized")
    }

    const [bot] = await db
      .update(bots)
      .set({ ...values, instructions: values.instructions || null })
      .where(and(eq(bots.id, id), eq(bots.userId, userId)))
      .returning()
    if (!bot) {
      throw new Error("Bot not found")
    }
    return bot
  })

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
