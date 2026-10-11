import { deepSeek } from "@ai-sdk/deepseek"
import { chat } from "@trigger.dev/sdk/ai"
import { asc } from "drizzle-orm"
import { db } from "../db"

const defaultInstructions = "You are a helpful assistant."

export const workSphereChat = chat.agent({
  id: "work-sphere-chat",
  run: async ({ chatId, messages, signal, streamText }) => {
    const chatRecord = await db.query.chats.findFirst({
      where: (chats, { eq }) => eq(chats.id, chatId),
      with: {
        members: {
          orderBy: (members) => asc(members.joinedAt),
          limit: 1,
          with: { bot: true },
        },
      },
    })

    return streamText({
      model: deepSeek("deepseek-flash"),
      instructions:
        chatRecord?.members[0]?.bot.instructions || defaultInstructions,
      messages,
      abortSignal: signal,
    })
  },
})
