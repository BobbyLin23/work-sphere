import { createFileRoute } from "@tanstack/react-router"
import { Chat } from "@/components/chat"
import { ChatHeader } from "@/components/chat-header"
import { getChat } from "@/queries/chats"

export const Route = createFileRoute("/(dashboard)/_dashboard/chats/$chatId")({
  loader: ({ params }) => getChat({ data: { chatId: params.chatId } }),
  component: ChatPage,
})

function ChatPage() {
  const chat = Route.useLoaderData()

  return (
    <div className="flex h-svh flex-col">
      <ChatHeader name={chat.name} bot={chat.bot} />
      <Chat key={chat.id} />
    </div>
  )
}
