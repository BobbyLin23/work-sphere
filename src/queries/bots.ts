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
          limit: 1,
          with: { bot: true },
        },
      },
    })

    return rows.flatMap((chat) => {
      const bot = chat.members[0]?.bot
      if (!bot) {
        return []
      }
      return {
        id: chat.id,
        name: chat.name ?? bot.name,
        avatar: bot.avatar,
        lastMessagePreview: chat.lastMessagePreview ?? bot.job,
        lastMessageAt: chat.lastMessageAt,
      }
    })
  }
)
