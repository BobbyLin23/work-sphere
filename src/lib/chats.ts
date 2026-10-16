import { auth } from "@clerk/tanstack-react-start/server"
import { createServerFn } from "@tanstack/react-start"
import { and, eq, inArray, notInArray } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import {
  bots,
  chatMembers,
  chats,
  createGroupChatSchema,
  updateGroupChatSchema,
} from "@/db/schema"

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

export const updateGroupChat = createServerFn({ method: "POST" })
  .validator(updateGroupChatSchema)
  .handler(async ({ data: { id, name, botIds: requestedBotIds } }) => {
    const { isAuthenticated, userId } = await auth()
    if (!isAuthenticated) {
      throw new Error("Unauthorized")
    }

    const botIds = [...new Set(requestedBotIds)]
    const owned = await db
      .select({ id: bots.id })
      .from(bots)
      .where(and(inArray(bots.id, botIds), eq(bots.userId, userId)))
    if (owned.length !== botIds.length || botIds.length < 2) {
      throw new Error("Bot not found")
    }

    await db.transaction(async (tx) => {
      const [chat] = await tx
        .update(chats)
        .set({ name })
        .where(
          and(
            eq(chats.id, id),
            eq(chats.userId, userId),
            eq(chats.kind, "group")
          )
        )
        .returning({ id: chats.id })
      if (!chat) {
        throw new Error("Chat not found")
      }
      await tx
        .delete(chatMembers)
        .where(
          and(eq(chatMembers.chatId, id), notInArray(chatMembers.botId, botIds))
        )
      await tx
        .insert(chatMembers)
        .values(botIds.map((botId) => ({ chatId: id, botId })))
        .onConflictDoNothing()
    })
  })

export const deleteGroupChat = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { isAuthenticated, userId } = await auth()
    if (!isAuthenticated) {
      throw new Error("Unauthorized")
    }

    const deleted = await db
      .delete(chats)
      .where(
        and(
          eq(chats.id, data.id),
          eq(chats.userId, userId),
          eq(chats.kind, "group")
        )
      )
      .returning({ id: chats.id })
    if (deleted.length === 0) {
      throw new Error("Chat not found")
    }
  })
