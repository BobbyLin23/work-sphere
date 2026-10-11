import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
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

const transport = new DefaultChatTransport({ api: "/api/chat" })

function Chat() {
  const { messages, sendMessage, status, stop } = useChat({ transport })

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
