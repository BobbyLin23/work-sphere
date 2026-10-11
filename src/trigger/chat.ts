import { deepSeek } from "@ai-sdk/deepseek"
import { chat } from "@trigger.dev/sdk/ai"
import { isStepCount } from "ai"
import { asc } from "drizzle-orm"
import { db } from "../db"
import type { bots } from "../db/schema"
import { createSandboxTools } from "./sandbox-tools"

type Bot = typeof bots.$inferSelect

function buildInstructions(bot: Bot | undefined) {
  if (!bot) {
    return "You are a helpful assistant."
  }

  const sections = [
    `You are ${bot.name}, an AI teammate in Work Sphere, a workspace where people chat with a team of AI bots. Your job is: ${bot.job}.`,
    "Your purpose is to help the user with work that fits your job. Stay in character as " +
      `${bot.name}, be clear and concise, and say so when something falls outside your job or you are not sure.`,
    "Environment: you have your own isolated cloud sandbox, a dedicated Linux computer with its own filesystem, network and runtime, separate from every other bot and user." +
      (bot.sandboxId ? ` Your sandbox ID is ${bot.sandboxId}.` : ""),
    [
      "The sandbox has a Linux desktop. You can work in it two ways:",
      "- Shell and files: bash, readFile, writeFile and listFiles. Prefer these for anything you can do with text, since they are faster and more reliable than the desktop.",
      "- Desktop: viewScreen to look at the screen, then mouseMove, mouseClick, mouseScroll, keyboardType and keyboardPress to operate it. Mouse coordinates are pixels in the viewScreen image. Look before you click, and look again after an action to check it worked.",
      "viewScreen is private to you. Only call showScreen when the user asks to see the screen or asks what is on it, and say in words what it shows. Never paste image data or base64 into your reply.",
      "Work step by step and keep going until the task is done. If a command or action fails, read the error and adjust instead of repeating it. Tell the user plainly what you did and what happened.",
    ].join("\n"),
  ]

  if (bot.instructions) {
    sections.push(
      `Additional instructions from your owner:\n${bot.instructions}`
    )
  }

  return sections.join("\n\n")
}

const findBot = async (chatId: string) => {
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
  return chatRecord?.members[0]?.bot
}

export const workSphereChat = chat.agent({
  id: "work-sphere-chat",
  tools: async ({ chatId }) =>
    createSandboxTools((await findBot(chatId))?.sandboxId),
  run: async ({ chatId, messages, tools, signal, streamText }) =>
    streamText({
      model: deepSeek("deepseek-flash"),
      instructions: buildInstructions(await findBot(chatId)),
      messages,
      tools,
      stopWhen: isStepCount(30),
      abortSignal: signal,
    }),
})
