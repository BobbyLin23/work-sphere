import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Chat } from "@/components/chat"
import { ChatHeader } from "@/components/chat-header"
import {
  SandboxScreenPreview,
  SandboxScreenProvider,
} from "@/components/sandbox-screen"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { getChat } from "@/queries/chats"

export const Route = createFileRoute("/(dashboard)/_dashboard/chats/$chatId")({
  loader: ({ params }) => getChat({ data: { chatId: params.chatId } }),
  component: ChatPage,
})

function ChatPage() {
  const chat = Route.useLoaderData()
  const [panelOpen, setPanelOpen] = useState(false)

  return (
    <SandboxScreenProvider
      chatId={chat.id}
      title={`${chat.bot.name}'s screen`}
      enabled={panelOpen}
    >
      <ResizablePanelGroup
        orientation="horizontal"
        style={{ height: "100svh" }}
      >
        <ResizablePanel
          minSize="30%"
          className="flex flex-col"
          style={{ overflow: "hidden" }}
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <ChatHeader
              name={chat.name}
              bot={chat.bot}
              panelOpen={panelOpen}
              onTogglePanel={() => setPanelOpen((open) => !open)}
            />
            <Chat key={chat.id} chatId={chat.id} />
          </div>
        </ResizablePanel>
        {panelOpen && (
          <>
            <ResizableHandle />
            <ResizablePanel
              defaultSize="40%"
              minSize="20%"
              className="flex flex-col"
              style={{ overflow: "hidden" }}
            >
              <SandboxScreenPreview title={`${chat.bot.name}'s screen`} />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </SandboxScreenProvider>
  )
}
