import { auth } from "@clerk/tanstack-react-start/server"
import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { bots, createBotSchema } from "@/db/schema"

export const createBot = createServerFn({ method: "POST" })
  .validator(createBotSchema)
  .handler(async ({ data }) => {
    const { isAuthenticated, userId } = await auth()
    if (!isAuthenticated) {
      throw new Error("Unauthorized")
    }

    const [bot] = await db
      .insert(bots)
      .values({ ...data, instructions: data.instructions || null, userId })
      .returning()
    return bot
  })
