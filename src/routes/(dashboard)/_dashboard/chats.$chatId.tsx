import { createFileRoute } from "@tanstack/react-router"
import { ChatHeader } from "@/components/chat-header"
import { getChat } from "@/queries/chats"

export const Route = createFileRoute("/(dashboard)/_dashboard/chats/$chatId")({
  loader: ({ params }) => getChat({ data: { chatId: params.chatId } }),
  component: ChatPage,
})

function ChatPage() {
  const chat = Route.useLoaderData()

  return <ChatHeader name={chat.name} bot={chat.bot} />
}
