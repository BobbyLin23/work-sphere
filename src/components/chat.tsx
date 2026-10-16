import { useChat } from "@ai-sdk/react"
import {
  useLoadTranscript,
  useTriggerChatTransport,
} from "@trigger.dev/sdk/chat/react"
import { useEffect, useRef, useState } from "react"
import { useServerFn } from "@tanstack/react-start"
import { getToolName, isToolUIPart } from "ai"
import type { UIMessage } from "ai"
import type { workSphereChat } from "@/trigger/chat"
import { Badge } from "@/components/ui/badge"
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
import { cn } from "@/lib/utils"
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

function getBotId(message: UIMessage | undefined) {
  const metadata = message?.metadata
  if (metadata && typeof metadata === "object" && "botId" in metadata) {
    return typeof metadata.botId === "string" ? metadata.botId : undefined
  }
  return undefined
}

const MAX_HANDOFFS = 3

function isHandoffMessage(message: UIMessage) {
  const metadata = message.metadata
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    "handoff" in metadata &&
    metadata.handoff === true
  )
}

function getHandoffTarget(message: UIMessage) {
  for (const part of message.parts) {
    if (
      isToolUIPart(part) &&
      getToolName(part) === "handoff" &&
      part.state === "output-available" &&
      typeof part.output === "object" &&
      part.output !== null &&
      "botId" in part.output &&
      typeof part.output.botId === "string"
    ) {
      return part.output.botId
    }
  }
  return undefined
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
  const handledMessageId = useRef<string>(undefined)
  const handoffCount = useRef(0)

  useEffect(() => {
    const last = messages.at(-1)
    if (
      status !== "ready" ||
      !members ||
      last?.role !== "assistant" ||
      handledMessageId.current === last.id
    ) {
      return
    }
    const targetId = getHandoffTarget(last)
    const target = members.find((m) => m.id === targetId)
    if (!target) return

    handledMessageId.current = last.id
    if (handoffCount.current >= MAX_HANDOFFS) return
    handoffCount.current += 1

    const from = members.find((m) => m.id === getBotId(last))
    setBotId(target.id)
    sendMessage(
      {
        text: `${from ? `${from.name} handed` : "The previous bot handed"} the user's latest request over to you, ${target.name}. Answer it now.`,
        metadata: { botId: target.id, handoff: true },
      },
      { metadata: { botId: target.id } }
    )
  }, [messages, status, members, sendMessage])

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
          {messages.map((message, index) => {
            if (isHandoffMessage(message)) return null
            const authorId =
              getBotId(message) ??
              (message.role === "assistant"
                ? getBotId(messages[index - 1])
                : undefined)
            const author =
              members && message.role === "assistant"
                ? members.find((m) => m.id === authorId)
                : undefined
            const recipient =
              members && message.role === "user"
                ? members.find((m) => m.id === getBotId(message))
                : undefined
            return (
              <Message
                key={message.id}
                from={message.role}
                className={cn(author && "flex-row items-start")}
              >
                {author && (
                  <ChatAvatar
                    seed={author.avatar}
                    className="size-8 shrink-0"
                  />
                )}
                <MessageContent>
                  {recipient && (
                    <p className="whitespace-pre-wrap break-words">
                      <Badge
                        variant="outline"
                        className="mr-1.5 h-6 max-w-40 gap-1.5 pl-1 align-middle"
                      >
                        <ChatAvatar
                          seed={recipient.avatar}
                          className="size-4 shrink-0"
                        />
                        <span className="truncate">{recipient.name}</span>
                      </Badge>
                      {message.parts.map((part) =>
                        part.type === "text" ? part.text : null
                      )}
                    </p>
                  )}
                  {(!recipient ? message.parts : []).map((part, index) => {
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
            )
          })}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="p-4">
        <PromptInput
          onSubmit={({ text }) => {
            if (!text.trim()) return
            handoffCount.current = 0
            sendMessage({ text, metadata: { botId } }, { metadata: { botId } })
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
