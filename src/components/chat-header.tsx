import { getRouteApi } from "@tanstack/react-router"
import { MonitorIcon } from "lucide-react"
import { BotDialog, type EditableBot } from "@/components/bot-dialog"
import { ChatAvatar } from "@/components/chat-avatar"
import {
  type EditableGroupChat,
  GroupChatDialog,
} from "@/components/group-chat-dialog"
import { GroupChatAvatar } from "@/components/group-chat-avatar"
import { Button } from "@/components/ui/button"

const dashboardRoute = getRouteApi("/(dashboard)/_dashboard")

type ChatHeaderProps = {
  name: string
  panelOpen: boolean
  onTogglePanel: () => void
} & (
  | { bot: EditableBot; group?: undefined }
  | {
      bot?: undefined
      group: EditableGroupChat & { avatars: string[] }
    }
)

function ChatHeader({
  name,
  bot,
  group,
  panelOpen,
  onTogglePanel,
}: ChatHeaderProps) {
  const chatList = dashboardRoute.useLoaderData()

  return (
    <header className="flex h-10 items-center justify-between border-b bg-background px-3">
      {bot ? (
        <BotDialog
          bot={bot}
          trigger={
            <Button variant="ghost" size="sm" className="gap-2 px-1">
              <ChatAvatar seed={bot.avatar} className="size-5" />
              <span className="font-medium text-sm">{name}</span>
            </Button>
          }
        />
      ) : (
        <GroupChatDialog
          chat={group}
          bots={chatList
            .filter((chat) => !chat.isGroup)
            .map((chat) => ({
              id: chat.botId,
              name: chat.name,
              avatar: chat.avatars[0],
            }))}
          trigger={
            <Button variant="ghost" size="sm" className="gap-2 px-1">
              <GroupChatAvatar seeds={group.avatars} className="size-5" />
              <span className="font-medium text-sm">{name}</span>
            </Button>
          }
        />
      )}
      {bot && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Desktop"
          aria-pressed={panelOpen}
          onClick={onTogglePanel}
        >
          <MonitorIcon />
        </Button>
      )}
    </header>
  )
}

export { ChatHeader }
