import { useChat } from "@ai-sdk/react"
import {
  useLoadTranscript,
  useTriggerChatTransport,
} from "@trigger.dev/sdk/chat/react"
import { useServerFn } from "@tanstack/react-start"
import type { UIMessage } from "ai"
import type { workSphereChat } from "@/trigger/chat"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input"
import {
  loadChatTranscript,
  mintChatAccessToken,
  startChatSession,
} from "@/queries/chat-agent"

function Chat({ chatId }: { chatId: string }) {
  const mintToken = useServerFn(mintChatAccessToken)
  const startSession = useServerFn(startChatSession)
  const loadTranscript = useServerFn(loadChatTranscript)

  const transport = useTriggerChatTransport<typeof workSphereChat>({
    task: "work-sphere-chat",
    accessToken: ({ chatId }) => mintToken({ data: { chatId } }),
    startSession: ({ chatId }) => startSession({ data: { chatId } }),
  })

  const { messages, isLoading } = useLoadTranscript(
    chatId,
    ({ chatId }) => loadTranscript({ data: { chatId } }),
    { transport }
  )

  if (isLoading) return null

  return (
    <ChatView
      chatId={chatId}
      initialMessages={messages}
      transport={transport}
    />
  )
}

function ChatView({
  chatId,
  initialMessages,
  transport,
}: {
  chatId: string
  initialMessages: UIMessage[]
  transport: ReturnType<typeof useTriggerChatTransport<typeof workSphereChat>>
}) {
  const { messages, sendMessage, status, stop } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Conversation>
        <ConversationContent>
          {messages.length === 0 && (
            <ConversationEmptyState
              title="Start a conversation"
              description="Send a message to begin chatting."
            />
          )}
          {messages.map((message) => (
            <Message key={message.id} from={message.role}>
              <MessageContent>
                <MessageResponse>
                  {message.parts
                    .map((part) => (part.type === "text" ? part.text : ""))
                    .join("")}
                </MessageResponse>
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="p-4">
        <PromptInput
          onSubmit={({ text }) => {
            if (text.trim()) sendMessage({ text })
          }}
        >
          <PromptInputBody>
            <PromptInputTextarea placeholder="Say something..." />
          </PromptInputBody>
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  )
}

export { Chat }
