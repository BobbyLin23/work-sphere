import { deepSeek } from "@ai-sdk/deepseek"
import { chat } from "@trigger.dev/sdk/ai"
import { hasToolCall, isStepCount } from "ai"
import { asc } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db"
import type { bots } from "../db/schema"
import { createHandoffTool } from "./handoff-tool"
import { createSandboxTools } from "./sandbox-tools"

type Bot = typeof bots.$inferSelect

function buildGroupSection(bot: Bot, teammates: Bot[]) {
  return [
    `Group chat: you are in a group chat with the user and ${teammates.length} other bot${teammates.length === 1 ? "" : "s"}. The user picks which bot answers each message, so you answer only when it is your turn. Earlier assistant replies in the history may come from other bots: you are ${bot.name} right now, so ignore the persona, job and instructions those replies followed.`,
    `Teammates:\n${teammates.map((mate) => `- ${mate.name} (id ${mate.id}): ${mate.job}`).join("\n")}`,
    [
      "Handoff: you have a handoff tool. Call it when the user's latest request clearly fits a teammate's job better than yours, and it does not fit yours.",
      "- Say at most one short sentence to the user about passing the request on, then call handoff with that teammate's id and a short reason. Do not answer the request yourself, and do not use other tools first.",
      "- The teammate answers next and sees the conversation. Never hand off to yourself, and do not hand off just because a request is hard, or for small talk or questions about you.",
      "- If a message was handed to you, answer it as yourself. Hand it on again only if it truly does not fit you either.",
    ].join("\n"),
    "Other bots have their own sandboxes. Your tools only act on your own sandbox, and you cannot see or change a teammate's files or desktop.",
  ].join("\n\n")
}

function buildInstructions(bot: Bot | undefined, teammates: Bot[]) {
  if (!bot) {
    return "You are a helpful assistant."
  }

  const sections = [
    `You are ${bot.name}, an AI teammate in Work Sphere, a workspace where people chat with a team of AI bots. Your job is: ${bot.job}.`,
    ...(teammates.length > 0 ? [buildGroupSection(bot, teammates)] : []),
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

  sections.push(
    [
      "Memory: MEMORY.md in your home directory is your long-term memory. It starts empty and survives across chats, because it lives in your sandbox. Your chat history does not: in a group chat you do not see what the user told you in your private 1:1 chat, and the reverse.",
      "- In your private 1:1 chat, when the user tells you something worth keeping (facts about them, preferences, decisions, ongoing projects, tasks, deadlines, things they ask you to remember), append a short, dated note to MEMORY.md with bash or writeFile. Read the file first so you keep what is already there, avoid duplicates, and fix notes that became outdated.",
      "- At the start of a conversation, and whenever the user refers to something you may have been told before, read MEMORY.md with readFile before you answer. This matters most in group chats: if the user asks about something that is not in the visible history, check MEMORY.md and answer from it instead of saying you do not know.",
      "- Keep it organized and concise, with short headed sections. Store only what is useful later. Never store passwords, API keys or other secrets. Do not announce every save, and do not tell the user the file exists unless they ask how you remember things.",
    ].join("\n")
  )

  if (bot.instructions) {
    sections.push(
      `Additional instructions from your owner:\n${bot.instructions}`
    )
  }

  return sections.join("\n\n")
}

const findChatBot = async (chatId: string, botId?: string) => {
  const chatRecord = await db.query.chats.findFirst({
    where: (chats, { eq }) => eq(chats.id, chatId),
    with: {
      members: {
        orderBy: (members) => asc(members.joinedAt),
        with: { bot: true },
      },
    },
  })
  const members = chatRecord?.members ?? []
  const isGroup = chatRecord?.kind === "group"
  const picked =
    isGroup && botId
      ? members.find((member) => member.botId === botId)
      : undefined
  const bot = (picked ?? members[0])?.bot
  const teammates = isGroup
    ? members.map((member) => member.bot).filter((mate) => mate.id !== bot?.id)
    : []
  return { bot, teammates }
}

export const workSphereChat = chat.agent({
  id: "work-sphere-chat",
  clientDataSchema: z.object({ botId: z.string().optional() }).optional(),
  tools: async ({ chatId, clientData }) => {
    const { bot, teammates } = await findChatBot(chatId, clientData?.botId)
    return {
      ...createSandboxTools(bot?.sandboxId),
      ...(teammates.length > 0
        ? { handoff: createHandoffTool(teammates) }
        : {}),
    }
  },
  run: async ({ chatId, clientData, messages, tools, signal, streamText }) => {
    const { bot, teammates } = await findChatBot(chatId, clientData?.botId)
    chat.setUIMessageStreamOptions({
      messageMetadata: ({ part }) =>
        part.type === "start" ? { botId: bot?.id } : undefined,
    })
    return streamText({
      model: deepSeek("deepseek-flash"),
      instructions: buildInstructions(bot, teammates),
      messages,
      tools,
      stopWhen: [hasToolCall("handoff"), isStepCount(30)],
      abortSignal: signal,
    })
  },
})
