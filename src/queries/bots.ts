import { auth } from "@clerk/tanstack-react-start/server"
import { createServerFn } from "@tanstack/react-start"
import { asc, desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { chats } from "@/db/schema"

export const getChatList = createServerFn({ method: "GET" }).handler(
  async () => {
    const { isAuthenticated, userId } = await auth()
    if (!isAuthenticated) {
      throw new Error("Unauthorized")
    }

    const rows = await db.query.chats.findMany({
      where: eq(chats.userId, userId),
      orderBy: desc(chats.lastMessageAt),
      with: {
        members: {
          orderBy: (members) => asc(members.joinedAt),
          with: { bot: true },
        },
      },
    })

    return rows.flatMap((chat) => {
      const bots = chat.members.map((member) => member.bot)
      const bot = bots[0]
      if (!bot) {
        return []
      }
      const isGroup = chat.kind === "group"
      return {
        id: chat.id,
        botId: bot.id,
        isGroup,
        name: chat.name ?? bots.map((member) => member.name).join(", "),
        avatars: bots.map((member) => member.avatar),
        lastMessagePreview:
          chat.lastMessagePreview ??
          (isGroup ? `${bots.length} bots` : bot.job),
        lastMessageAt: chat.lastMessageAt,
      }
    })
  }
)
