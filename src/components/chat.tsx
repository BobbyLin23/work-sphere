import { useChat } from "@ai-sdk/react"
import {
  useLoadTranscript,
  useTriggerChatTransport,
} from "@trigger.dev/sdk/chat/react"
import { useState } from "react"
import { useServerFn } from "@tanstack/react-start"
import { isToolUIPart } from "ai"
import type { UIMessage } from "ai"
import type { workSphereChat } from "@/trigger/chat"
import { ChatAvatar } from "@/components/chat-avatar"
import { ToolCall } from "@/components/chat-tool-call"
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
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input"
import {
  loadChatTranscript,
  mintChatAccessToken,
  startChatSession,
} from "@/queries/chat-agent"

type ChatMember = {
  id: string
  name: string
  avatar: string
}

function Chat({ chatId, members }: { chatId: string; members?: ChatMember[] }) {
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
      members={members}
      transport={transport}
    />
  )
}

function ChatView({
  chatId,
  initialMessages,
  members,
  transport,
}: {
  chatId: string
  initialMessages: UIMessage[]
  members?: ChatMember[]
  transport: ReturnType<typeof useTriggerChatTransport<typeof workSphereChat>>
}) {
  const { messages, sendMessage, status, stop } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
  })
  const [botId, setBotId] = useState(members?.[0]?.id)

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
                {message.parts.map((part, index) => {
                  const key = `${message.id}-${index}`
                  if (part.type === "text") {
                    return part.text ? (
                      <MessageResponse key={key}>{part.text}</MessageResponse>
                    ) : null
                  }
                  if (isToolUIPart(part)) {
                    return <ToolCall key={part.toolCallId} part={part} />
                  }
                  return null
                })}
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="p-4">
        <PromptInput
          onSubmit={({ text }) => {
            if (!text.trim()) return
            sendMessage({ text }, { metadata: { botId } })
          }}
        >
          <PromptInputBody>
            <PromptInputTextarea placeholder="Say something..." />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              {members && botId && (
                <PromptInputSelect
                  value={botId}
                  onValueChange={(value) => {
                    if (typeof value === "string") setBotId(value)
                  }}
                >
                  <PromptInputSelectTrigger>
                    <PromptInputSelectValue>
                      {(value: string) => {
                        const member = members.find((m) => m.id === value)
                        return member ? (
                          <span className="flex items-center gap-2">
                            <ChatAvatar
                              seed={member.avatar}
                              className="size-4"
                            />
                            {member.name}
                          </span>
                        ) : null
                      }}
                    </PromptInputSelectValue>
                  </PromptInputSelectTrigger>
                  <PromptInputSelectContent>
                    {members.map((member) => (
                      <PromptInputSelectItem key={member.id} value={member.id}>
                        <ChatAvatar seed={member.avatar} className="size-4" />
                        {member.name}
                      </PromptInputSelectItem>
                    ))}
                  </PromptInputSelectContent>
                </PromptInputSelect>
              )}
            </PromptInputTools>
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  )
}

export { Chat }
