import { createFileRoute } from "@tanstack/react-router"
import { deepSeek } from "@ai-sdk/deepseek"
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai"

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages }: { messages: UIMessage[] } = await request.json()

        const result = streamText({
          model: deepSeek("deepseek-flash"),
          instructions: "You are a helpful assistant.",
          messages: await convertToModelMessages(messages),
        })

        return createUIMessageStreamResponse({
          stream: toUIMessageStream({ stream: result.stream }),
        })
      },
    },
  },
})
