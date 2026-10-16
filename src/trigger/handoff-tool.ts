import { tool } from "ai"
import { z } from "zod"
import type { bots } from "../db/schema"

type Bot = typeof bots.$inferSelect

export function createHandoffTool(teammates: Bot[]) {
  const ids = teammates.map((bot) => bot.id) as [string, ...string[]]

  return tool({
    description:
      "Hand the user's latest request over to another bot in this group chat. " +
      "Use it only when the request clearly fits a teammate's job better than yours. " +
      "The chosen bot answers next, so do not try to answer the request yourself. " +
      `Teammates: ${teammates.map((bot) => `${bot.name} (id ${bot.id}): ${bot.job}`).join("; ")}.`,
    inputSchema: z.object({
      botId: z.enum(ids).describe("ID of the teammate who should answer"),
      reason: z
        .string()
        .describe("One short sentence on why that bot is a better fit"),
    }),
    execute: async ({ botId, reason }) => {
      const target = teammates.find((bot) => bot.id === botId)
      if (!target) {
        throw new Error("Unknown teammate")
      }
      return { botId: target.id, name: target.name, reason }
    },
  })
}
