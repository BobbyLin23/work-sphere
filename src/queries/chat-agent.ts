import { auth as clerkAuth } from "@clerk/tanstack-react-start/server"
import { createServerFn } from "@tanstack/react-start"
import { auth } from "@trigger.dev/sdk"
import { chat, defaultStorage } from "@trigger.dev/sdk/ai"
import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { chats } from "@/db/schema"

async function assertChatOwner(chatId: string) {
  const { isAuthenticated, userId } = await clerkAuth()
  if (!isAuthenticated) {
    throw new Error("Unauthorized")
  }

  const owned = await db.query.chats.findFirst({
    columns: { id: true },
    where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
  })
  if (!owned) {
    throw new Error("Chat not found")
  }
}

const startSession = chat.createStartSessionAction("work-sphere-chat")
const loadTranscript = chat.createLoadTranscriptAction(defaultStorage, {
  limit: 50,
})

const chatIdSchema = z.object({ chatId: z.string() })

export const startChatSession = createServerFn({ method: "POST" })
  .validator(chatIdSchema)
  .handler(async ({ data }) => {
    await assertChatOwner(data.chatId)
    return startSession({ chatId: data.chatId })
  })

export const mintChatAccessToken = createServerFn({ method: "POST" })
  .validator(chatIdSchema)
  .handler(async ({ data }) => {
    await assertChatOwner(data.chatId)
    return auth.createPublicToken({
      scopes: {
        read: { sessions: data.chatId },
        write: { sessions: data.chatId },
      },
      expirationTime: "1h",
    })
  })

export const loadChatTranscript = createServerFn({ method: "POST" })
  .validator(chatIdSchema)
  .handler(async ({ data }) => {
    await assertChatOwner(data.chatId)
    const { messages, cursors } = await loadTranscript({
      chatId: data.chatId,
    })
    // UIMessage metadata is `unknown`, which TanStack Start cannot prove
    // serializable. The data is JSON by construction, so round-trip it.
    return JSON.parse(JSON.stringify({ messages, cursors }))
  })
